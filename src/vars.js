import * as d3 from 'd3';

export const vars = {
	'mode': 'entries',
	'dateRange': [new Date(2019, 4, 15), new Date(2019, 7, 31)],
	'metadata': null,
	'coordinatedJointId': null,
	'coordinatedHarmonizedId': null,
	'uncoordinatedId': null,
	'stakeholder_type_keys': {},
	'timeFormat': d3.timeFormat("%d-%m-%Y"),
	'geoBounds': {'lat': [], 'lon': []},
	'atype_keys': {},
	'data_collection_technique_keys': {},
	'margin': {top: 18, right: 216, bottom: 0, left: 45},
	'scale': {
		'timechart': {x: '', y1: '', y2: '', xTop: ''},
		'trendline': {x: '', y: ''},
		'bumpchart': {x: '', y: ''},
		'sparkline': {x: '', y: ''},
		'tooltipSparkline': {x: '', y: ''},
		'map': '',
		'eventdrop': '',
		'severity': {x: '', y: ''},
		'sector': {x: '', y: ''},
		'humanitarianprofile': {x: '', y: ''},
		'reliability': {x: '', y: ''}
	}
}