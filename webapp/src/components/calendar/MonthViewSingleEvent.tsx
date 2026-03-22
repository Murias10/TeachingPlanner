// @ts-nocheck
import MonthView from "react-big-calendar/lib/Month";

class MonthViewSingleEvent extends MonthView {
    measureRowLimit() {
        this.setState({
            needLimitMeasure: false,
            rowLimit: 1,
        });
    }
}

MonthViewSingleEvent.navigate = MonthView.navigate;
MonthViewSingleEvent.title = MonthView.title;
MonthViewSingleEvent.range = MonthView.range;

export default MonthViewSingleEvent;
