import ActivityKit
import Foundation

/// Attributes describing a running-timer Live Activity.
///
/// Static `Attributes` are intentionally empty: every value that can change
/// across the lifetime of a single Live Activity (name, color, start time)
/// lives in `ContentState`, so an in-app "switch activity" can be a single
/// `Activity.update(...)` call rather than end-and-recreate.
@available(iOS 16.1, *)
public struct TimerActivityAttributes: ActivityAttributes {
    public typealias TimerStatus = ContentState

    public struct ContentState: Codable, Hashable {
        /// Wall-clock instant the timer started. Used directly by SwiftUI's
        /// `Text(timerInterval:)`, which the OS animates without us pushing
        /// updates every second.
        public var startedAt: Date

        /// Display name of the running activity (e.g. "Deep Work").
        public var activityName: String

        /// Hex string for the parent category color (e.g. "#3654E8").
        /// Parsed to SwiftUI Color in the widget via Color(hex:).
        public var categoryColorHex: String

        public init(startedAt: Date, activityName: String, categoryColorHex: String) {
            self.startedAt = startedAt
            self.activityName = activityName
            self.categoryColorHex = categoryColorHex
        }
    }

    public init() {}
}
