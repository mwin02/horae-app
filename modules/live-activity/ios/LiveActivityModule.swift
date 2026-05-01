import ActivityKit
import ExpoModulesCore
import Foundation

/// JS-facing bridge to ActivityKit for the running-timer Live Activity.
///
/// Lifecycle is owned entirely by JS via `useLiveActivity` (Block 3) — this
/// module is intentionally dumb: start / update / end / isSupported.
public class LiveActivityModule: Module {
    public func definition() -> ModuleDefinition {
        Name("LiveActivity")

        // Returns true on iOS 16.1+ if the user has Live Activities enabled
        // in system Settings; false on Android, older iOS, or when the user
        // has disabled them.
        Function("isSupported") { () -> Bool in
            if #available(iOS 16.2, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            } else if #available(iOS 16.1, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            } else {
                return false
            }
        }

        AsyncFunction("start") { (payload: StartPayload, promise: Promise) in
            if #available(iOS 16.1, *) {
                LiveActivityController.shared.start(payload: payload, promise: promise)
            } else {
                promise.reject("E_UNSUPPORTED", "Live Activities require iOS 16.1+")
            }
        }

        AsyncFunction("update") { (payload: StartPayload, promise: Promise) in
            if #available(iOS 16.1, *) {
                LiveActivityController.shared.update(payload: payload, promise: promise)
            } else {
                promise.resolve(nil)
            }
        }

        AsyncFunction("end") { (promise: Promise) in
            if #available(iOS 16.1, *) {
                LiveActivityController.shared.end(promise: promise)
            } else {
                promise.resolve(nil)
            }
        }
    }
}

// MARK: - Payload

internal struct StartPayload: Record {
    @Field var activityName: String = ""
    @Field var categoryColorHex: String = "#6E8BFF"
    /// JS sends UNIX milliseconds (`Date.now()` style). We convert to Date.
    @Field var startedAtMs: Double = 0
}

// MARK: - Activity controller (singleton)

@available(iOS 16.1, *)
private final class LiveActivityController {
    static let shared = LiveActivityController()

    /// We track the most recent activity reference keyed by id. On a fresh
    /// app launch we also reconcile with `Activity<…>.activities` to recover
    /// from a prior crash.
    private var current: Activity<TimerActivityAttributes>?

    private init() {
        rehydrate()
    }

    private func rehydrate() {
        // If a previous app instance left an activity running, adopt the
        // first one we find so subsequent updates target it.
        if let existing = Activity<TimerActivityAttributes>.activities.first {
            self.current = existing
        }
    }

    func start(payload: StartPayload, promise: Promise) {
        // If something is already running (e.g. crash recovery), update it
        // in place rather than stacking activities.
        if current != nil {
            update(payload: payload, promise: promise)
            return
        }

        let state = TimerActivityAttributes.ContentState(
            startedAt: Date(timeIntervalSince1970: payload.startedAtMs / 1000.0),
            activityName: payload.activityName,
            categoryColorHex: payload.categoryColorHex
        )
        let attributes = TimerActivityAttributes()

        do {
            if #available(iOS 16.2, *) {
                let activity = try Activity.request(
                    attributes: attributes,
                    content: .init(state: state, staleDate: nil),
                    pushType: nil
                )
                self.current = activity
            } else {
                let activity = try Activity.request(
                    attributes: attributes,
                    contentState: state,
                    pushType: nil
                )
                self.current = activity
            }
            promise.resolve(nil)
        } catch {
            promise.reject("E_LIVE_ACTIVITY_START", error.localizedDescription)
        }
    }

    func update(payload: StartPayload, promise: Promise) {
        guard let activity = current else {
            // Nothing to update — treat as start so callers don't have to
            // care about lifecycle ordering.
            start(payload: payload, promise: promise)
            return
        }

        let state = TimerActivityAttributes.ContentState(
            startedAt: Date(timeIntervalSince1970: payload.startedAtMs / 1000.0),
            activityName: payload.activityName,
            categoryColorHex: payload.categoryColorHex
        )

        Task {
            if #available(iOS 16.2, *) {
                await activity.update(.init(state: state, staleDate: nil))
            } else {
                await activity.update(using: state)
            }
            promise.resolve(nil)
        }
    }

    func end(promise: Promise) {
        guard let activity = current else {
            promise.resolve(nil)
            return
        }

        Task {
            if #available(iOS 16.2, *) {
                await activity.end(nil, dismissalPolicy: .immediate)
            } else {
                await activity.end(dismissalPolicy: .immediate)
            }
            self.current = nil
            promise.resolve(nil)
        }
    }
}
