import SwiftUI
import WidgetKit

// MARK: - Snapshot model + reader
//
// The host app writes a JSON blob of the running entry to the shared App
// Group UserDefaults on every running-entry transition (see
// `LiveActivityModule.writeWidgetSnapshot` and `useWidgetSnapshot` on the
// JS side). The widget reads it here on every `getTimeline` call and
// rerenders. Refresh is push-driven via `WidgetCenter.reloadAllTimelines()`
// from the bridge, not polling — `Timeline.policy` is `.never`.
//
// The constants below MUST match the ones in
// `modules/live-activity/ios/LiveActivityModule.swift`.

private let WIDGET_APP_GROUP = "group.com.myozawwin.horae.shared"
private let WIDGET_SNAPSHOT_KEY = "runningTimerSnapshot"

struct RunningSnapshot: Codable {
    let entryId: String
    let startedAt: Date
    let activityName: String
    let categoryColor: String
}

private func readRunningSnapshot() -> RunningSnapshot? {
    guard
        let defaults = UserDefaults(suiteName: WIDGET_APP_GROUP),
        let data = defaults.data(forKey: WIDGET_SNAPSHOT_KEY)
    else { return nil }

    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    decoder.dateDecodingStrategy = .custom { decoder in
        let container = try decoder.singleValueContainer()
        let raw = try container.decode(String.self)
        // ISO 8601 with optional fractional seconds — JS emits the latter
        // via Date.prototype.toISOString.
        let withFractional = ISO8601DateFormatter()
        withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = withFractional.date(from: raw) { return d }
        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        if let d = plain.date(from: raw) { return d }
        throw DecodingError.dataCorruptedError(
            in: container, debugDescription: "Invalid ISO 8601 date: \(raw)")
    }
    return try? decoder.decode(RunningSnapshot.self, from: data)
}

// MARK: - Timeline provider

struct TimerEntry: TimelineEntry {
    let date: Date
    let snapshot: RunningSnapshot?
}

struct TimerTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> TimerEntry {
        TimerEntry(date: Date(), snapshot: Self.sampleSnapshot)
    }

    func getSnapshot(in context: Context, completion: @escaping (TimerEntry) -> Void) {
        let snapshot = readRunningSnapshot() ?? (context.isPreview ? Self.sampleSnapshot : nil)
        completion(TimerEntry(date: Date(), snapshot: snapshot))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TimerEntry>) -> Void) {
        let entry = TimerEntry(date: Date(), snapshot: readRunningSnapshot())
        // Refresh is driven by `WidgetCenter.reloadAllTimelines()` from the
        // host app whenever the running entry changes — no scheduled reloads.
        completion(Timeline(entries: [entry], policy: .never))
    }

    /// Sample state shown in the widget gallery + previews.
    static let sampleSnapshot = RunningSnapshot(
        entryId: "sample",
        startedAt: Date().addingTimeInterval(-48 * 60 - 21),
        activityName: "Deep Work",
        categoryColor: "#3654E8"
    )
}

// MARK: - Widget

@available(iOS 16.1, *)
struct HoraeTimerWidget: Widget {
    let kind: String = "HoraeTimerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TimerTimelineProvider()) { entry in
            HoraeTimerWidgetView(entry: entry)
        }
        .configurationDisplayName("Running Timer")
        .description("See your running timer at a glance.")
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - Views

@available(iOS 16.1, *)
private struct HoraeTimerWidgetView: View {
    let entry: TimerEntry

    var body: some View {
        Group {
            if let snapshot = entry.snapshot {
                ActiveStateView(snapshot: snapshot)
            } else {
                IdleStateView()
            }
        }
        .widgetBackgroundIfAvailable {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "#F4F3FB"),
                    Color(hex: "#E2E0F2"),
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// Deep links the widget fires through the host app's URL handler
// (`useTimerDeepLinks` on the JS side). Routing to the root path with a
// query param avoids Expo Router's "Oops! / This screen doesn't exist"
// 404 — see the matching comment in `TimerLiveActivity.swift`.
private let STOP_URL = URL(string: "horae:///?action=stop")!
private let NEW_SESSION_URL = URL(string: "horae:///?action=newSession")!

private let INK_COLOR = Color(red: 0x0E/255, green: 0x0F/255, blue: 0x1A/255)
private let MUTED_COLOR = Color(red: 0x0E/255, green: 0x0F/255, blue: 0x1A/255).opacity(0.45)

@available(iOS 16.1, *)
private struct ActiveStateView: View {
    let snapshot: RunningSnapshot

    var body: some View {
        ZStack(alignment: .topTrailing) {
            HStack(alignment: .center, spacing: 16) {
                IconTile(colorHex: snapshot.categoryColor, size: 84, cornerRadius: 22)

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color(hex: snapshot.categoryColor))
                            .frame(width: 6, height: 6)
                        Text("TRACKING")
                            .font(.system(size: 10, weight: .bold))
                            .kerning(1.2)
                            .foregroundColor(Color(hex: snapshot.categoryColor))
                    }
                    Text(snapshot.activityName)
                        .font(.system(size: 18, weight: .heavy))
                        .kerning(-0.4)
                        .foregroundColor(INK_COLOR)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    timerText(startedAt: snapshot.startedAt, size: 30, weight: .heavy)
                        .foregroundColor(INK_COLOR)
                        .padding(.top, 2)
                }

                Spacer(minLength: 0)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 16)

            // Top-right Stop button. `Link` wins over the surrounding
            // widget tap target — taps inside the 32pt circle go to
            // `?action=stop`; taps anywhere else open the app normally.
            Link(destination: STOP_URL) {
                Image(systemName: "stop.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(INK_COLOR))
            }
            .padding(.top, 14)
            .padding(.trailing, 14)

            // Bottom-right HORAE wordmark.
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    Text("HORAE")
                        .font(.system(size: 10, weight: .bold))
                        .kerning(1.4)
                        .foregroundColor(MUTED_COLOR)
                }
            }
            .padding(.trailing, 16)
            .padding(.bottom, 12)
            .allowsHitTesting(false)
        }
    }
}

@available(iOS 16.1, *)
private struct IdleStateView: View {
    var body: some View {
        // The whole idle card is the tap target — `widgetURL` on the
        // outer view sends taps anywhere (outside any inner Link) to the
        // host app. The deep-link handler opens NewSessionModal.
        ZStack(alignment: .bottomTrailing) {
            VStack(spacing: 10) {
                HoraeLogoMark(size: 36)
                Text("Tap to start tracking")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(INK_COLOR)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            Text("HORAE")
                .font(.system(size: 10, weight: .bold))
                .kerning(1.4)
                .foregroundColor(MUTED_COLOR)
                .padding(.trailing, 16)
                .padding(.bottom, 12)
        }
        .widgetURL(NEW_SESSION_URL)
    }
}

// MARK: - Compatibility shims

@available(iOS 16.1, *)
private extension View {
    /// iOS 17+ requires `containerBackground(for:)`; on 16.x we paint the
    /// background ourselves. Both produce the same visual result.
    @ViewBuilder
    func widgetBackgroundIfAvailable<Background: View>(
        @ViewBuilder _ background: () -> Background
    ) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(for: .widget) { background() }
        } else {
            self.background(background())
        }
    }
}

