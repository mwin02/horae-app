import SwiftUI
import WidgetKit

/// Entry point for the Horae widget extension.
///
/// Currently hosts only the running-timer Live Activity. Home-screen widgets
/// (Active / Idle from the design handoff) would be added here in a future
/// block alongside `TimerLiveActivity`.
@main
struct HoraeWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.1, *) {
            TimerLiveActivity()
        }
    }
}
