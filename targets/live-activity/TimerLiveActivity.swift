import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Live Activity definition

/// Lock-screen banner + Dynamic Island layouts for the running-timer Live
/// Activity. Visuals are lifted from the design handoff
/// (`HoraeLiveActivity` and `HoraeDynamicIsland` in widget-and-live.jsx),
/// minus the Pause button and progress bar (out of scope per product
/// direction). The Stop button is added in a later block.
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
                    // Stop button placeholder — wired in Block 4.
                    Color.clear.frame(width: 28, height: 28)
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
            // Action row (Stop button) added in Block 4.
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

/// Renders the app's home-screen icon (the pie/clock mark in
/// `assets/images/icon.png`, exposed to the widget bundle as the
/// `HoraeLogo` image asset). Used both on the Lock Screen banner's top
/// row and on the Dynamic Island expanded leading region.
@available(iOS 16.1, *)
private struct HoraeLogoMark: View {
    let size: CGFloat

    var body: some View {
        Image("HoraeLogo")
            .resizable()
            .aspectRatio(contentMode: .fill)
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.32,
                                        style: .continuous))
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
