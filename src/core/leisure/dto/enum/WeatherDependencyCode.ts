/**
 * What an `activity-weather-dependency` lookup row *means*, as the server resolves it
 * (`WeatherDependencyCodes.Effective`: the stored code, else one guessed from the label). The rows
 * themselves are user-editable, so the id and the label say nothing; this does. The server sends these
 * exact spellings.
 */
export enum WeatherDependencyCode {
	/** Fits any weather — "indoors, don't care". Not a weather dependency at all. */
	None = 'none',
	Sunny = 'sunny',
	Dry = 'dry',
	Snow = 'snow',
}
