class Record {
    constructor(activityId, startTimestamp, length) {
        this.getActivityId = () => activityId;
        this.getStartTimestamp = () => startTimestamp;
        this.getLength = () => length;
    }

    // Helper method to parse the startTimestamp into a Date object
    getStartTimestampAsDate() {
        return new Date(this.getStartTimestamp());
    }

    // Helper method to convert the object to a JSON representation
    toJSON() {
        return {
            activityId: this.getActivityId(),
            startTimestamp: this.getStartTimestamp(),
            length: this.getLength(),
        };
    }
}
const activity = new Record(2, "2023-09-06T18:48:39+02:00[Europe/Bratislava]", 5);

// Access properties
console.log(activity.getActivityId()); // 2
console.log(activity.getStartTimestamp()); // "2023-09-06T18:48:39+02:00[Europe/Bratislava]"
console.log(activity.getLength()); // 5