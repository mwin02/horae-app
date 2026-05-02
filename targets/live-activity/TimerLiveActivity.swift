import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Live Activity definition

/// Lock-screen banner + Dynamic Island layouts for the running-timer Live
/// Activity. Visuals are lifted from the design handoff
/// (`HoraeLiveActivity` and `HoraeDynamicIsland` in widget-and-live.jsx),
/// minus the Pause button and progress bar (out of scope per product
/// direction).
///
/// Action button: a single Stop control on the Lock Screen banner action
/// row and the Dynamic Island expanded trailing region. Both are SwiftUI
/// `Link` views pointing at `horae://timer/stop` rather than
/// `LiveActivityIntent` — Live Activities have supported `Link` for
/// per-region tap targets since iOS 16.1, and routing through the app's
/// existing URL handler keeps the DB write in JS instead of duplicating
/// PowerSync access in Swift. The `useTimerDeepLinks` hook on the JS side
/// resolves the running entry and calls `stopEntry`.
@available(iOS 16.1, *)
struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            LockScreenView(state: context.state)
                .activityBackgroundTint(Color(red: 28/255, green: 28/255, blue: 32/255).opacity(0.92))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HoraeLogoMark(size: 32)
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.activityName.uppercased())
                            .font(.system(size: 10, weight: .bold))
                            .kerning(1.4)
                            .foregroundColor(Color(hex: context.state.categoryColorHex))
                            .lineLimit(1)
                        timerText(startedAt: context.state.startedAt, size: 16, weight: .bold)
                            .foregroundColor(.white)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    StopButton(style: .roundIcon)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    EmptyView()
                }
            } compactLeading: {
                // Compact regions are intentionally tight: a thin colored dot
                // on the leading + a fixed-width MM:SS counter on the trailing
                // keeps the island narrow enough not to crowd the system clock
                // / battery on the right side of the status bar.
                Circle()
                    .fill(Color(hex: context.state.categoryColorHex))
                    .frame(width: 8, height: 8)
                    .padding(.leading, 2)
            } compactTrailing: {
                // No live counter here — even MM:SS noticeably widens the
                // island. The Horae mark on the trailing keeps it visually
                // balanced with the colored dot on the leading while
                // signalling "this is Horae" at a glance. Full elapsed time
                // is still available on the lock-screen banner and on the
                // Dynamic Island expanded view (tap-and-hold).
                HoraeLogoMark(size: 16)
            } minimal: {
                Circle()
                    .fill(Color(hex: context.state.categoryColorHex))
                    .frame(width: 8, height: 8)
            }
            .keylineTint(Color(hex: context.state.categoryColorHex))
        }
    }
}

// MARK: - Lock-screen banner

@available(iOS 16.1, *)
private struct LockScreenView: View {
    let state: TimerActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            topRow
            bodyRow
            StopButton(style: .lockScreenPill)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    private var topRow: some View {
        HStack(spacing: 8) {
            HoraeLogoMark(size: 22)
            Text("HORAE")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.white.opacity(0.75))
            Text("· now")
                .font(.system(size: 12))
                .foregroundColor(.white.opacity(0.45))
            Spacer()
        }
    }

    private var bodyRow: some View {
        HStack(alignment: .center, spacing: 12) {
            IconTile(colorHex: state.categoryColorHex, size: 44, cornerRadius: 14)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    LiveDot()
                    Text("TRACKING")
                        .font(.system(size: 10, weight: .bold))
                        .kerning(1.4)
                        .foregroundColor(Color(hex: state.categoryColorHex))
                }
                Text(state.activityName)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .truncationMode(.tail)
            }

            Spacer(minLength: 8)

            VStack(alignment: .trailing, spacing: 2) {
                timerText(startedAt: state.startedAt, size: 22, weight: .heavy)
                    .foregroundColor(.white)
                Text("since \(formattedClock(state.startedAt))")
                    .font(.system(size: 10))
                    .foregroundColor(.white.opacity(0.5))
            }
        }
    }
}

// MARK: - Shared sub-views

@available(iOS 16.1, *)
private struct IconTile: View {
    let colorHex: String
    let size: CGFloat
    var cornerRadius: CGFloat? = nil

    var body: some View {
        let radius = cornerRadius ?? size / 2
        let color = Color(hex: colorHex)
        RoundedRectangle(cornerRadius: radius, style: .continuous)
            .fill(color.opacity(0.22))
            .frame(width: size, height: size)
            .overlay(
                Image(systemName: "clock.fill")
                    .font(.system(size: size * 0.5, weight: .semibold))
                    .foregroundColor(color)
            )
    }
}

@available(iOS 16.1, *)
private struct LiveDot: View {
    var body: some View {
        Circle()
            .fill(Color(red: 124/255, green: 255/255, blue: 179/255))
            .frame(width: 6, height: 6)
            .shadow(color: Color(red: 124/255, green: 255/255, blue: 179/255).opacity(0.6),
                    radius: 3, x: 0, y: 0)
    }
}

/// Renders the app's home-screen icon (`HoraeLogo` in
/// `Assets.xcassets`).
///
/// IMPORTANT — image size: WidgetKit enforces a strict per-image memory
/// budget on Live Activity snapshots. Oversized bitmaps are silently
/// dropped and replaced with a grey placeholder rather than triggering
/// a runtime error. The bundled icon is pre-resized to 192px for this
/// reason; do not swap it for the full 1024px app icon. See
/// https://developer.apple.com/forums/thread/716902.
@available(iOS 16.1, *)
private struct HoraeLogoMark: View {
    let size: CGFloat

    var body: some View {
        Image("HoraeLogo")
            .renderingMode(.original)
            .resizable()
            .scaledToFill()
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.32,
                                        style: .continuous))
    }
}

// MARK: - Stop button

/// Two visual variants for the same action:
///   - `.lockScreenPill`  → full-width white pill (Lock Screen action row).
///   - `.roundIcon`       → 28pt translucent round (Dynamic Island expanded
///                          trailing region).
///
/// Both wrap a `Link(destination: horae://timer/stop)`. iOS routes the
/// URL through the host app's URL handler — picked up by
/// `useTimerDeepLinks` on the JS side, which resolves the running entry
/// and calls `stopEntry`. Using `Link` rather than a `LiveActivityIntent`
/// avoids needing iOS 17 and keeps the action layer pure-SwiftUI.
@available(iOS 16.1, *)
private struct StopButton: View {
    enum Style {
        case lockScreenPill
        case roundIcon
    }

    let style: Style

    private static let stopURL = URL(string: "horae://timer/stop")!

    var body: some View {
        Link(destination: Self.stopURL) {
            switch style {
            case .lockScreenPill:
                HStack(spacing: 6) {
                    Image(systemName: "stop.fill")
                        .font(.system(size: 12, weight: .bold))
                    Text("Stop & save")
                        .font(.system(size: 13, weight: .bold))
                }
                .foregroundColor(Color(red: 0x0E/255, green: 0x0F/255, blue: 0x1A/255))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color.white)
                )
            case .roundIcon:
                Image(systemName: "stop.fill")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 28, height: 28)
                    .background(
                        Circle()
                            .fill(Color.white.opacity(0.12))
                    )
            }
        }
    }
}

// MARK: - Helpers

@available(iOS 16.1, *)
private func timerText(startedAt: Date, size: CGFloat, weight: Font.Weight) -> some View {
    // Text(timerInterval:) animates seconds at the OS level — no per-second
    // JS pushes. `showsHours: true` auto-promotes to HH:MM:SS past 1 hour.
    Text(timerInterval: startedAt...Date.distantFuture,
         pauseTime: nil,
         countsDown: false,
         showsHours: true)
        .font(.system(size: size, weight: weight, design: .rounded))
        .monospacedDigit()
        .kerning(-0.4)
}

private func formattedClock(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "HH:mm"
    return formatter.string(from: date)
}

// MARK: - Xcode previews
//
// Live Activity previews use the `#Preview` macro on iOS 17+, which isn't
// available pre-iOS-17. Skipping previews here keeps the widget portable
// across deployment targets; visual iteration happens in the simulator
// once the JS bridge (Block 2) lands.
