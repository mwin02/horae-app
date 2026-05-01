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
                    IconTile(colorHex: context.state.categoryColorHex, size: 36)
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
                IconTile(colorHex: context.state.categoryColorHex, size: 22)
            } compactTrailing: {
                timerText(startedAt: context.state.startedAt, size: 13, weight: .semibold)
                    .foregroundColor(.white)
            } minimal: {
                Circle()
                    .fill(Color(hex: context.state.categoryColorHex))
                    .frame(width: 10, height: 10)
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
            HoraeMark()
                .frame(width: 22, height: 22)
                .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
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

@available(iOS 16.1, *)
private struct HoraeMark: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0xC9/255, green: 0xA3/255, blue: 0x6B/255),
                         Color(red: 0x8B/255, green: 0x6E/255, blue: 0x4A/255)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            // Tiny pie mark echoing the splash icon.
            ZStack {
                Circle()
                    .fill(Color(red: 0xA8/255, green: 0xB0/255, blue: 0xA4/255))
                Path { path in
                    path.move(to: CGPoint(x: 7, y: 1))
                    path.addArc(center: CGPoint(x: 7, y: 7),
                                radius: 6,
                                startAngle: .degrees(-90),
                                endAngle: .degrees(-30),
                                clockwise: false)
                    path.closeSubpath()
                }
                .fill(Color(red: 0xC2/255, green: 0x65/255, blue: 0x45/255))
                .frame(width: 14, height: 14)
            }
            .frame(width: 14, height: 14)
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
