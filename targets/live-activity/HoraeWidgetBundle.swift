import SwiftUI
import WidgetKit

/// Entry point for the Horae widget extension.
///
/// Hosts the running-timer Live Activity (Lock Screen + Dynamic Island)
/// and the home-screen running-timer widget.
@main
struct HoraeWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.1, *) {
            TimerLiveActivity()
            HoraeTimerWidget()
        }
    }
}
