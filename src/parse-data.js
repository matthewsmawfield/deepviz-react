import * as d3 from 'd3';
import {filters} from './Filters.js';
import {vars} from './Vars.js';
import jsonData from './dummy-data.json';

export function parseData(){

    vars.dataEntries = jsonData.entry_data.data;
    vars.dataAssessments = jsonData.ary_data.data;
    vars.metadata = jsonData.entry_data.meta;
    vars.metadata.geo_array = jsonData.geo_data;
    vars.metadataAry = jsonData.ary_data.meta;
    vars.metadataAry.geo_array = vars.metadata.geo_array;
    vars.urlQueryParams = new URLSearchParams(window.location.search);

	parseGeoData();
	parseEntriesMetadata();
	parseEntriesData();
	parseAssessmentsMetadata();
	parseAssessmentsData();

	if(vars.mode=='entries'){
		vars.data = vars.dataEntries;
	} else {
		vars.data = vars.dataAssessments;
	}

	// parse url variable options
	if(vars.urlQueryParams.get('minDate')){
		vars.minDate = new Date(vars.urlQueryParams.get('minDate'));
		vars.minDate.setHours(0);
		vars.minDate.setMinutes(0);
		vars.data = vars.data.filter(function(d){
			return d.date >= vars.minDate;
		});
		vars.dataAssessments = vars.dataAssessments.filter(function(d){
			return d.date >= vars.minDate;
		});
	}

	if(vars.urlQueryParams.get('maxDate')){
		vars.maxDate = new Date(vars.urlQueryParams.get('maxDate'));
		vars.maxDate.setHours(0);
		vars.maxDate.setMinutes(0);
		vars.data = vars.data.filter(function(d){
			return d.date <= vars.maxDate;
		})
		vars.dataAssessments = vars.dataAssessments.filter(function(d){
			return d.date <= vars.maxDate;
		})
	}

	if(vars.urlQueryParams.get('time')){
		filters.time=vars.urlQueryParams.get('time');
	}

	if(vars.urlQueryParams.get('admin_level')){
		filters.admin_level=parseInt(vars.urlQueryParams.get('admin_level'));
	}

	// set the data again for reset purposes
	vars.originalData = vars.data;
	vars.originalDataAssessments = vars.dataAssessments;
	vars.dataNotSeverity = vars.data;
	vars.dataNotReliability = vars.data;

	// num contextual rows
	vars.numContextualRows = vars.metadata.context_array.length;

	//**************************
	// find maximum and minimum values in the data to define scales
	//**************************

	// define maximum date 
	vars.maxDate = new Date(d3.max(vars.data, function(d){
		return d.date;
	}));

	vars.maxDate.setDate(vars.maxDate.getDate() + 1);
	vars.maxDate.setHours(0);
	vars.maxDate.setMinutes(0);

	var today = new Date();
	if(vars.maxDate<today){
		vars.maxDate = today;
	};

	vars.dateRange[1] = vars.maxDate;
	
	// define minimum date 
	vars.minDate = new Date(d3.min(vars.data, function(d){
		return d.date;
	}));

	vars.minDate.setDate(vars.minDate.getDate());
	vars.minDate.setHours(0);
	vars.minDate.setMinutes(0);

	var countDays = Math.round(Math.abs((vars.minDate - vars.maxDate) / (24 * 60 * 60 * 1000)));

	var rangeScale = d3.scaleLog()
	.range([0.15,1])
	.domain([3000,30]);

	vars.range = rangeScale(countDays);

	// define maximum value by date
	vars.dataByDate = d3.nest()
	.key(function(d) { return d.date;})
	.rollup(function(leaves) { return leaves.length; })
	.entries(vars.data);

	vars.maxValue = d3.max(vars.dataByDate, function(d) {
		return d.value;
	});

	vars.dataByMonth = d3.nest()
	.key(function(d) { return d.date.getMonth();})
	.rollup(function(leaves) { return leaves.length; })
	.entries(vars.data);

	// define maximum location value
	vars.dataByLocation = d3.nest()
	.key(function(d) { return d.geo;})
	.rollup(function(leaves) { return leaves.length; })
	.entries(vars.data);

    // define timechart X scale
    vars.dateIndex = vars.data.map(function(d) { return d['date']; });

    vars.scale.timechart.x = d3.scaleTime()
    .domain([vars.minDate, vars.maxDate])
    .range([0, (vars.width - (vars.margin.right + vars.margin.left))])
    .nice();

    vars.scale.trendline.x = d3.scaleTime()
    .domain([0, vars.dataByDate.length-1])
    .range([0, (vars.width - (vars.margin.right + vars.margin.left))])
    .rangeRound([0, (vars.width - (vars.margin.right + vars.margin.left))], 0);

    organiseData();

}

export function parseGeoData(){

	// parse parent locations up to 4 levels
	vars.dataEntries.forEach(function(d,i){
		d.geo.forEach(function(dd,ii){
			dd = parseInt(dd);
			var parents = [];
			var parent = getParent(dd, vars.metadata);
			if((parent>0)&&(!parents.includes(parent))&&(!d.geo.includes(parent))){
				parents.push(parent);
			}
			var parent = getParent(parent, vars.metadata);
			if((parent>0)&&(!parents.includes(parent))&&(!d.geo.includes(parent))){
				parents.push(parent);
			}
			var parent = getParent(parent, vars.metadata);
			if((parent>0)&&(!parents.includes(parent))&&(!d.geo.includes(parent))){
				parents.push(parent);
			}
			var parent = getParent(parent, vars.metadata);
			if((parent>0)&&(!parents.includes(parent))&&(!d.geo.includes(parent))){
				parents.push(parent);
			}
			d.geo.push.apply(d.geo,parents);
		});

	});

	vars.dataAssessments.forEach(function(d,i){
		d.geo.forEach(function(dd,ii){
			dd = parseInt(dd);
			var parents = [];
			var parent = getParent(dd, vars.metadata);
			if((parent>0)&&(!parents.includes(parent))&&(!d.geo.includes(parent))){
				parents.push(parent);
			}
			var parent = getParent(parent, vars.metadata);
			if((parent>0)&&(!parents.includes(parent))&&(!d.geo.includes(parent))){
				parents.push(parent);
			}
			var parent = getParent(parent, vars.metadata);
			if((parent>0)&&(!parents.includes(parent))&&(!d.geo.includes(parent))){
				parents.push(parent);
			}
			var parent = getParent(parent, vars.metadata);
			if((parent>0)&&(!parents.includes(parent))&&(!d.geo.includes(parent))){
				parents.push(parent);
			}
			d.geo.push.apply(d.geo,parents);
		});
	});

	// remove unused locations
	var locationArray = [];
	vars.dataAssessments.forEach(function(d,i){
		d.geo.forEach(function(dd,ii){
			if(!locationArray.includes(parseInt(dd))){
				locationArray.push(parseInt(dd));
			}
		})
	});

	vars.dataEntries.forEach(function(d,i){
		d.geo.forEach(function(dd,ii){
			if(!locationArray.includes(parseInt(dd))){
				locationArray.push(parseInt(dd));
			}
		})
	});

	var newGeoArray = [];
	vars.metadata.geo_array.forEach(function(d,i,obj){
		if(locationArray.includes(parseInt(d.id))){
			newGeoArray.push(d);
		}	
	})

	vars.metadata.geo_array = newGeoArray;

	vars.metadata.geo_array.sort(function(x, y){
	   return d3.ascending(x.name, y.name);
	});

	vars.metadata.geo_json = {"type": "FeatureCollection", "features": []};
	vars.metadata.geo_json_point = {"type": "FeatureCollection", "features": []};

	vars.metadata.geo_array.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
		var polygons = d.polygons;
		polygons.coordinates = polygons.coordinates;
		var feature = {'type':'Feature', 'properties':{'name': d.name, 'id': d.id, 'admin_level': d.admin_level}, 'geometry': polygons }
		vars.metadata.geo_json.features[i] = feature;
		var point = { "type": "Point", "coordinates": [ d.centroid[0],d.centroid[1],0.0 ] }
		var featurePoint = {'type':'Feature', 'properties':{'name': d.name, 'id': d.id, 'admin_level': d.admin_level}, 'geometry': point }
		vars.metadata.geo_json_point.features[i] = featurePoint;
	});

	vars.metadata.geo_json.features.forEach(function(feature) {
	   if(feature.geometry.type == "MultiPolygon") {
	     feature.geometry.coordinates.forEach(function(polygon) {
	       polygon.forEach(function(ring) {
	         ring.reverse();
	       })
	     })
	   }
	   else if (feature.geometry.type == "Polygon") {
	     feature.geometry.coordinates.forEach(function(ring) {
	       ring.reverse();
	     })  
	   }
	 });

}

export function parseAssessmentsMetadata(){
	// parse meta data, create integer id column from string ids and programattically attempt to shorten label names
	vars.metadataAry.focus_array.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});

	vars.metadataAry.data_collection_technique.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
		if(d.name=='Focus Group Discussion') vars.data_collection_technique_keys.focus_group_discussion = d.id;
		if(d.name=='Key Informant Interview') vars.data_collection_technique_keys.key_informant_interview = d.id;
		if(d.name=='Community Group Discussion') vars.data_collection_technique_keys.community_group_discussion = d.id;
	});

	vars.metadataAry.type_of_unit_of_analysis.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});

	vars.metadataAry.methodology_content.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});

	vars.metadataAry.additional_documentation_array.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});

	vars.metadataAry.language.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});

	vars.metadataAry.assessment_type.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
		if(d.name=='Initial') vars.atype_keys.initial = d.id;
		if(d.name=='Rapid') vars.atype_keys.rapid = d.id;
		if(d.name=='In-depth') vars.atype_keys.in_depth = d.id;
		if(d.name=='Monitoring') vars.atype_keys.monitoring = d.id;
	});

	vars.metadataAry.sampling_approach.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});

	vars.metadataAry.coordination.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
		if(d.name=='Coordinated - Joint') vars.coordinatedJointId = d.id;
		if(d.name=='Coordinated - Harmonized') vars.coordinatedHarmonizedId = d.id;
		if(d.name=='Uncoordinated') vars.uncoordinatedId = d.id;
	});

	vars.metadataAry.affected_groups_array.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});

	vars.metadataAry.sector_array.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});

	vars.metadataAry.organization.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
		d.name = d.short_name;
	});

	vars.metadataAry.organization_type.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
		if(d.name=='Donor') vars.stakeholder_type_keys.donor = d.id;
		if(d.name=='International Organization') vars.stakeholder_type_keys.ingo = d.id;
		if(d.name=='Non-governmental Organization') vars.stakeholder_type_keys.lngo = d.id;
		if(d.name=='Government') vars.stakeholder_type_keys.government = d.id;
		if(d.name=='UN Agency') vars.stakeholder_type_keys.un_agency = d.id;
		if(d.name=='UN Agencies') vars.stakeholder_type_keys.un_agency = d.id;
		if(d.name=='Red Cross/Red Crescent Movement') vars.stakeholder_type_keys.rcrc = d.id;
		if(d.name=='Cluster') vars.stakeholder_type_keys.cluster = d.id;
	});

	vars.metadataAry.scorepillar_scale.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});
}

export function parseAssessmentsData(){
// PARSE ASSESSMENT DATA IDS
	vars.dataAssessments.forEach(function(d,i){
		d.date = new Date(d.date);
		d.date.setHours(0,0,0,0);
		d.month = new Date(d.date);
		d.month.setHours(0,0,0,0);
		d.month.setDate(1);
		d.year = new Date(d.date);
		d.year.setHours(0,0,0,0);
		d.year.setDate(1);
		d.year.setMonth(0);
		d.date_str = vars.timeFormat(d.date);

		// PARSE STRING IDS TO INTEGERS
		// parse context array
		d._focus = d.focus;
		d.focus = [];
		d._focus.forEach(function(dd,ii){
			vars.metadataAry.focus_array.forEach(function(ddd,ii){
				if(dd==ddd._id){
					if(!d.focus.includes(ddd.id)) d.focus.push(ddd.id);
				}
			});
		});

		// parse affected groups array
		d._affected_groups = d.affected_groups;
		d.affected_groups = [];
		d._affected_groups.forEach(function(dd,ii){
			vars.metadataAry.affected_groups_array.forEach(function(ddd,ii){
				if(dd==ddd._id){
					if(!d.affected_groups.includes(ddd.id)) d.affected_groups.push(ddd.id);
				}
			});
		});

		// parse sector array
		d._sector = d.sector;
		d.sector = [];
		d._sector.forEach(function(dd,ii){
			vars.metadataAry.sector_array.forEach(function(ddd,ii){
				if(dd==ddd._id){
					if(!d.sector.includes(ddd.id)) d.sector.push(ddd.id);
				}
			});
		});

		d.sector_count = d.sector.length;

		// parse assessment type
		d._assessment_type = d.assessment_type;
		d.assessment_type_str = '';
		vars.metadataAry.assessment_type.forEach(function(ddd,ii){
			if(parseInt(d._assessment_type)==parseInt(ddd._id)){
				d.assessment_type = parseInt(ddd.id);
				d.assessment_type_str = ddd.name;
			}
		});

		// parse coordination 
		d._coordination = d.coordination;
		d.coordination_str = '';
		vars.metadataAry.coordination.forEach(function(ddd,ii){
			if(d._coordination==ddd._id){
				d.coordination = ddd.id;
				d.coordination_str = ddd.name;
			}
		});

		// parse language array
		d._language = d.language;
		d.language = [];
		if(d._language){
			d._language.forEach(function(dd,ii){
				vars.metadataAry.language.forEach(function(ddd,ii){
					if(dd==ddd._id){
						if(!d.language.includes(ddd.id)) d.language.push(ddd.id);
					}
				});
			});		
		}

		// parse sampling_approach array
		d._sampling_approach = d.sampling_approach;
		d.sampling_approach = [];
		var sa = [];
		d._sampling_approach.forEach(function(dd,ii){
			vars.metadataAry.sampling_approach.forEach(function(ddd,ii){
				if((dd==ddd._id)&&(!d.sampling_approach.includes(ddd.id))){
					if(!d.sampling_approach.includes(ddd.id)) d.sampling_approach.push(ddd.id);
				}
			});
		});

		// parse data collection technique 
		d._data_collection_technique = d.data_collection_technique;
		d.data_collection_technique = [];
		d._data_collection_technique.forEach(function(dd,ii){
			vars.metadataAry.data_collection_technique.forEach(function(ddd,ii){
				if(dd==ddd._id){
					if(!d.data_collection_technique.includes(ddd.id)) d.data_collection_technique.push(ddd.id);
				}
			});
		});

		// parse unit of analysis
		d._unit_of_analysis = d.unit_of_analysis;
		d.unit_of_analysis = [];
		d._unit_of_analysis.forEach(function(dd,ii){
			vars.metadataAry.type_of_unit_of_analysis.forEach(function(ddd,ii){
				if(dd==ddd._id){
					if(!d.unit_of_analysis.includes(ddd.id)) d.unit_of_analysis.push(ddd.id);
				}
			});
		});

		// parse unit of reporting
		d._unit_of_reporting = d.unit_of_reporting;
		d.unit_of_reporting = [];
		d._unit_of_reporting.forEach(function(dd,ii){
			vars.metadataAry.type_of_unit_of_analysis.forEach(function(ddd,ii){
				if(dd==ddd._id){
					if(!d.unit_of_reporting.includes(ddd.id)) d.unit_of_reporting.push(ddd.id);
				}
			});
		});

		// parse methodology content
		d._methodology_content = d.methodology_content;
		d.methodology_content = [];
		d._methodology_content.forEach(function(dd,ii){
			if(dd==1){
				if(!d.methodology_content.includes(vars.metadataAry.methodology_content[ii])) d.methodology_content.push(vars.metadataAry.methodology_content[ii])
			}
		});

		// parse additional documentation available 
		d._additional_documentation = d.additional_documentation;
		d.additional_documentation = [];
		d._additional_documentation.forEach(function(dd,ii){
			if(dd>=1){
				var doc = {'id': vars.metadataAry.additional_documentation_array[ii].id, name: vars.metadataAry.additional_documentation_array[ii].name, value: dd };
				if(!d.additional_documentation.includes(doc)) d.additional_documentation.push(doc)
			}
		});

		// parse analytical density sector keys
		d.scores._analytical_density = d.scores.analytical_density;
		d.scores.analytical_density = [];

		Object.entries(d.scores._analytical_density).forEach(function(dd,ii){
			var sector = dd[0];
			var value = dd[1];
			vars.metadataAry.sector_array.forEach(function(ddd,ii){
				if(sector==ddd._id){
					var obj = {};
					obj.sector = ddd.id;
					obj.name = ddd.name;
					obj.value = value;
					d.scores.analytical_density.push(obj);
				}
			});
		});

		// parse organisations array
		d._organization_and_stakeholder_type = d.organization_and_stakeholder_type;
		d.organization_and_stakeholder_type = [];
		d.organization_str = [];
		d.stakeholder_type = [];
		d._organization_and_stakeholder_type.forEach(function(dd,ii){
			var orgId;
			var orgTypeId;
			vars.metadataAry.organization.forEach(function(ddd,ii){
				if((dd[1]==ddd._id)&&(!d.organization_str.includes(ddd.short_name))){
					orgId = ddd.id;
					d.organization_str.push(ddd.short_name)

				}
			});
			vars.metadataAry.organization_type.forEach(function(ddd,ii){
				if(dd[0]==ddd._id){
					orgTypeId = ddd.id;
				}
			});
			if(!d.organization_and_stakeholder_type.includes([orgTypeId, orgId])){
				d.organization_and_stakeholder_type.push([orgTypeId, orgId]);
			}
			if(!d.stakeholder_type.includes(orgTypeId)){
				d.stakeholder_type.push(orgTypeId);
			}
		});
		d.organization_str = (d.organization_str.join(", "));

		// parse scorepillar scale id
		d._scorepillar_scale = d.scorepillar_scale;
		vars.metadataAry.scorepillar_scale.forEach(function(ddd,ii){
			if(d._scorepillar_scale==ddd._id){
				d.scorepillar_scale = ddd.id;
			}
			// parse null values
			if(d._scorepillar_scale===null){
				d.scorepillar_scale = 0;
			}
		});

		// parse geo id
		d._geo = d.geo;
		d.geo = [];
		d._geo.forEach(function(dd,ii){
			vars.metadataAry.geo_array.forEach(function(ddd,ii){
				if(dd==ddd._id){
					if(!d.geo.includes(ddd.id)){d.geo.push(ddd.id);};
					vars.geoBounds.lat.push(ddd.bounds[0][0]);
					vars.geoBounds.lat.push(ddd.bounds[1][0]);
					vars.geoBounds.lon.push(ddd.bounds[0][1]);
					vars.geoBounds.lon.push(ddd.bounds[1][1]);
				}
			});
		});

		var analytical_densityScore = d.scores.final_scores.score_matrix_pillar['1'];
		var scores = [];
		scores.push(analytical_densityScore);

		Object.keys(d.scores.final_scores.score_pillar).forEach(function(key,index) {
		    scores.push(d.scores.final_scores.score_pillar[key]);
		});

		var finalScore = d3.median(scores, function(md){
			return md;
		});

		d.final_score = finalScore;

		if(finalScore<=5){
			d.finalScore = 0;
		} else if(finalScore<=10){
			d.finalScore = 1;
		} else if(finalScore<=15){
			d.finalScore = 2;
		} else if(finalScore<=20){
			d.finalScore = 3;
		} else if (finalScore<=25){
			d.finalScore = 4;
		};

		d.top = [];

		if((d.sector_count==1)&&((d.coordination == vars.coordinatedJointId)||(d.coordination == vars.coordinatedHarmonizedId))){
			d.top.push('coordination_1');
		}
		if((d.sector_count>=2)&&((d.coordination == vars.coordinatedJointId)||(d.coordination == vars.coordinatedHarmonizedId))){
			d.top.push('coordination_2');
		}
		if((d.sector_count>=5)&&((d.coordination == vars.coordinatedJointId)||(d.coordination == vars.coordinatedHarmonizedId))){
			d.top.push('coordination_5');
		}
		if(d.coordination==vars.coordinatedHarmonizedId){
			d.top.push('harmonized');
		}
		if(d.coordination==vars.uncoordinatedId){
			d.top.push('uncoordinated');
		}
		if(d.sector_count>=5){
			d.top.push('sector_5');
		}
		if(d.sector_count>=2){
			d.top.push('sector_2');
		}
		if(d.sector_count==1){
			d.top.push('sector_1');
		}
		if((d.sector_count>=5)&&(d.assessment_type==vars.atype_keys.monitoring)){
			d.top.push('monitoring_5');
		}
		if((d.sector_count>=2)&&(d.assessment_type==vars.atype_keys.monitoring)){
			d.top.push('monitoring_2');
		}
		if((d.sector_count==1)&&(d.assessment_type==vars.atype_keys.monitoring)){
			d.top.push('monitoring_1');
		}
		if(d.assessment_type==vars.atype_keys.initial){
			d.top.push('initial');
		}
		if(d.assessment_type==vars.atype_keys.rapid){
			d.top.push('rapid');
		}
		if(d.assessment_type==vars.atype_keys.in_depth){
			d.top.push('in_depth');
		}
		if(d.data_collection_technique.includes(vars.data_collection_technique_keys.focus_group_discussion)){
			d.top.push('focus_group_discussion');
		}
		if(d.data_collection_technique.includes(vars.data_collection_technique_keys.key_informant_interview)){
			d.top.push('key_informant_interview');
		}
		if(d.data_collection_technique.includes(vars.data_collection_technique_keys.community_group_discussion)){
			d.top.push('community_group_discussion');
		}
		// STAKEHOLDER TYPE
		if(d.stakeholder_type.includes(vars.stakeholder_type_keys.donor)){
			d.top.push('donor');
		}
		if(d.stakeholder_type.includes(vars.stakeholder_type_keys.ingo)){
			d.top.push('ingo');
		}
		if(d.stakeholder_type.includes(vars.stakeholder_type_keys.lngo)){
			d.top.push('lngo');
		}
		if(d.stakeholder_type.includes(vars.stakeholder_type_keys.government)){
			d.top.push('government');
		}
		if(d.stakeholder_type.includes(vars.stakeholder_type_keys.un_agency)){
			d.top.push('un_agency');
		}
		if(d.stakeholder_type.includes(vars.stakeholder_type_keys.rcrc)){
			d.top.push('rcrc');
		}
		if(d.stakeholder_type.includes(vars.stakeholder_type_keys.cluster)){
			d.top.push('cluster');
		}

	});

}

export function parseEntriesData(){

	vars.dataEntries.forEach(function(d,i){
		d.date = new Date(d.date);
		d.date.setHours(0,0,0,0);
		d.month = new Date(d.date);
		d.month.setHours(0,0,0,0);
		d.month.setDate(1);
		d.year = new Date(d.date);
		d.year.setHours(0,0,0,0);
		d.year.setDate(1);
		d.year.setMonth(0);

		// PARSE STRING IDS TO INTEGERS
		// parse context array
		d._context = d.context;
		d.context = [];
		d._context.forEach(function(dd,ii){
			vars.metadata.context_array.forEach(function(ddd,ii){
				if(dd==ddd._id){
					d.context.push(ddd.id);
				}
			});
		});
		// parse specific needs array
		d._special_needs = d.special_needs;
		d.special_needs = [];
		d._special_needs.forEach(function(dd,ii){
			vars.metadata.specific_needs_groups_array.forEach(function(ddd,ii){
				if(dd==ddd._id){
					d.special_needs.push(ddd.id);
				}
			});
		});
		// parse affected groups array
		d._affected_groups = d.affected_groups;
		d.affected_groups = [];
		d._affected_groups.forEach(function(dd,ii){
			vars.metadata.affected_groups_array.forEach(function(ddd,ii){
				if(dd==ddd._id){
					d.affected_groups.push(ddd.id);
				}
			});
		});
		// parse affected groups array
		d._sector = d.sector;
		d.sector = [];
		d._sector.forEach(function(dd,ii){
			var context_id = 0;
			vars.metadata.context_array.forEach(function(ddd,ii){
				if(dd[0]==ddd._id){
					context_id = ddd.id;
				}
			});
			var framework_id = 0;
			vars.metadata.framework_groups_array.forEach(function(ddd,ii){
				if(dd[1]==ddd._id){
					framework_id = ddd.id;
				}
			});
			var sector_id = 0;
			vars.metadata.sector_array.forEach(function(ddd,ii){
				if(dd[2]==ddd._id){
					sector_id = ddd.id;
				}
			});
			d.sector.push([context_id,framework_id,sector_id]);
		});

		// parse severity id
		d._severity = d.severity;
		vars.metadata.severity_units.forEach(function(ddd,ii){
			if(d._severity==ddd._id){
				d.severity = ddd.id;
			}
			// parse null values
			if(d._severity===null){
				d.severity = 0;
			}
		});
		
		// parse reliability id
		d._reliability = d.reliability;
		vars.metadata.reliability_units.forEach(function(ddd,ii){
			if(d._reliability==ddd._id){
				d.reliability = ddd.id;
			}
			// parse null values
			if(d._reliability===null){
				d.reliability = 0;
			}
		});
		// parse geo id
		d._geo = d.geo;
		d.geo = [];

		d._geo.forEach(function(dd,ii){
			vars.metadata.geo_array.forEach(function(ddd,ii){
				if(dd==ddd._id){
					if(!d.geo.includes(ddd.id)){d.geo.push(ddd.id);};
					vars.geoBounds.lat.push(ddd.bounds[0][0]);
					vars.geoBounds.lat.push(ddd.bounds[1][0]);
					vars.geoBounds.lon.push(ddd.bounds[0][1]);
					vars.geoBounds.lon.push(ddd.bounds[1][1]);
				}
			});
		});

	});

}

export function parseEntriesMetadata(){

	// parse meta data, create integer id column from string ids and programattically attempt to shorten label names
	vars.metadata.context_array.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});
	vars.metadata.framework_groups_array.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
		d._context_id = d.context_id;
		// programattically shorten a long framework label
		if(d.name== "Status of essential infrastructure, systems, markets and networks"){
			d.name = "Infrastructure, systems, markets and networks";
		}
		vars.metadata.context_array.forEach(function(ddd,ii){
			if(d._context_id==ddd._id){
				d.context_id = ddd.id;
			}
		});
	});
	vars.metadata.affected_groups_array.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
		d.humanitarian_profile = [];
		var affectedGroups = d.name.split("/");
		affectedGroups.forEach(function(dd,ii){
			var name = dd.trim().replace(/\s+/g,'');
			d.humanitarian_profile.push(name);
		});
		d.name_alt = d.name;
		if(affectedGroups.length>1){
			d.name = affectedGroups[affectedGroups.length-2].trim() + ' / ' + affectedGroups[affectedGroups.length-1].trim()
		} 
	});
	vars.metadata.specific_needs_groups_array.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});
	vars.metadata.sector_array.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});
	vars.metadata.severity_units.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
		// shorten label by cutting text after the first full-stop
		d.name = d.name.split('.')[0];
	});
	vars.metadata.reliability_units.forEach(function(d,i){
		d._id = d.id;
		d.id = i+1;
	});
	vars.metadata.severity_units.unshift({
		"id": 6,
		"color": "grey",
		"name": "Null",
		"_id": null,
	});
	vars.metadata.reliability_units.unshift({
		"id": 6,
		"color": "grey",
		"name": "Null",
		"_id": null,
	});

}

export function getParent(geo_id, metadata){
	var parent;
	metadata.geo_array.forEach(function(d,i){
		if(geo_id==d.id){
			parent = d.parent;
		}
	})
	return parseInt(parent);
}

export function organiseData(){

	vars.dataByDate = d3.nest()
	.key(function(d) { return d.date;})
	.key(function(d) { return d.severity; })
	.rollup(function(leaves) { return leaves.length; })
	.entries(vars.data);	

	vars.dateByReliability = d3.nest()
	.key(function(d) { return d.date;})
	.key(function(d) { return d.reliability; })
	.rollup(function(leaves) { return leaves.length; })
	.entries(vars.data);

	if(filters.time=='m'){
		vars.dataByDate = d3.nest()
		.key(function(d) { return d.month;})
		.key(function(d) { return d.severity; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(vars.data);			

		vars.dateByReliability = d3.nest()
		.key(function(d) { return d.month;})
		.key(function(d) { return d.reliability; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(vars.data);
	}

	if(filters.time=='y'){
		vars.dataByDate = d3.nest()
		.key(function(d) { return d.year;})
		.key(function(d) { return d.severity; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(vars.data);			

		vars.dateByReliability = d3.nest()
		.key(function(d) { return d.year;})
		.key(function(d) { return d.reliability; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(vars.data);
	}

	// entries data
	vars.dataByFrameworkSector = [];
	vars.dataByLead = [];
	var leadArray = [];
	vars.dataByPublisher = [];
	var publisherArray = [];
	vars.dataBySector = [];
	vars.dataByFramework = [];
	vars.dataByAffectedGroups = [];
	vars.dataByAffectedGroupsRows = [];
	vars.dataBySpecificNeeds = [];
	vars.dataByLocationArray = [];
	vars.dataByContextArray = [];
	vars.dataByFrameworkContext = [];

	vars.data.forEach(function(d,i){
		var frameworks = [];
		var contexts = [];
		var sectors = [];
		// leads
		var leadArrayStr = d.date.getTime()+'-'+d.lead.id;
		if(!leadArray.includes(leadArrayStr)){
			leadArray.push(leadArrayStr);
			var leadRow = {"date": d.date, "month": d.month, "year": d.year, lead_id: d.lead.id};
			vars.dataByLead.push(leadRow);
		};

		// publishers (unique based on source_raw strinng)
		if(d.lead.source){
			var src = d.lead.source.id;
		} else {
			var src = d.lead.source_raw;
		}
		var publisherArrayStr = d.date.getTime()+'-'+src;
		if(!publisherArray.includes(publisherArrayStr)){
			publisherArray.push(publisherArrayStr);
			var publisherRow = {"date": d.date, "month": d.month, "year": d.year, publisher_str: src};
			if(src>0){
				vars.dataByPublisher.push(publisherRow);
			}
		};

		d.sector.forEach(function(dd,ii){
			var c = dd[0];
			var f = dd[1];
			var s = dd[2];
			// data by sector (non-unique) for framework cells
			vars.dataByFrameworkSector.push({"date": d.date, "month": d.month, "year": d.year, "context": c, "framework": f, "sector": s, 's': d.severity, 'r': d.reliability});
			// unique entries by framework
			var frameworkRow = {"date": d.date, "context": c, "framework": f, 's': d.severity, 'r': d.reliability};
			if(!frameworks.includes(f)){
				vars.dataByFramework.push(frameworkRow);
				frameworks.push(f);
			}
			// unique entries by context
			var contextRow = {"date": d.date, "month": d.month, "year": d.year, "context": c, 's': d.severity, 'r': d.reliability};
			if(!contexts.includes(c)){
				vars.dataByFrameworkContext.push(contextRow);
				contexts.push(c);
			}
			// unique entries by sector
			var sectorRow = {"date": d.date, "month": d.month, "year": d.year, "sector": s, 's': d.severity, 'r': d.reliability};
			if(!sectors.includes(s)){
				vars.dataBySector.push(sectorRow);
				sectors.push(s);
			}
		});

		d.geo.forEach(function(dd,ii){
			var adm = null;
			vars.metadata.geo_array.forEach(function(d,i){
				if(dd==d.id){
					adm = d.admin_level;
				}
			})
			vars.dataByLocationArray.push({"date": d.date, "month": d.month, "year": d.year, "geo": dd, "admin_level": adm, 's': d.severity, 'r': d.reliability });
		});

		d.context.forEach(function(dd,ii){
			vars.dataByContextArray.push({"date": d.date, "month": d.month, "year": d.year, "context": dd, 's': d.severity, 'r': d.reliability})
		});

		d.special_needs.forEach(function(dd,ii){
			vars.dataBySpecificNeeds.push({"date": d.date, "month": d.month, "year": d.year, "specific_needs": dd, 's': d.severity, 'r': d.reliability})
		});

		var affectedGroupsArray = [];
		var agArray = [];

		d.affected_groups.forEach(function(dd,ii){
			var str;
			vars.metadata.affected_groups_array.forEach(function(d,i){
				if(dd==d.id){
					str = d.name_alt;
				}
			});
			var affectedGroups = str.split("/");
			affectedGroups.forEach(function(ddd,iii){
				var ag = ddd.trim();
				var row = {"pk": d.pk, "level": iii+1, "date": d.date, "month": d.month, "year": d.year, "affected_groups": ag, 's': d.severity, 'r': d.reliability};
				if(!agArray.includes(d.pk+'-'+ag)){
					agArray.push(d.pk+'-'+ag);
					vars.dataByAffectedGroupsRows.push(row);
				}
			});
			vars.dataByAffectedGroups.push({"pk": d.pk, "date": d.date, "month": d.month, "year": d.year, "affected_groups": dd, 's': d.severity, 'r': d.reliability})
		});

	});

	vars.dataByLocation = d3.nest()
	.key(function(d) { return d.date;})
	.key(function(d) { return d.geo; })
	.rollup(function(leaves) { return leaves.length; })
	.entries(vars.dataByLocationArray);

	// assessments data
	vars.dataByAssessmentType = [];
	vars.dataByOrganisation = [];
	vars.dataByOrganisationType = [];
	
	vars.dataAssessments.forEach(function(d,i){
		vars.dataByAssessmentType.push({"date": d.date, "month": d.month, "year": d.year, 'assessment_type': parseInt(d.assessment_type), 's': d.finalScore, 'r': null});

		d.organization_and_stakeholder_type.forEach(function(dd,ii){
			var name;
			vars.metadataAry.organization.forEach(function(ddd,ii){
				if(parseInt(ddd.id)==parseInt(dd[1])){
					name = ddd.name;
					vars.dataByOrganisation.push({"date": d.date, "month": d.month, "year": d.year, "stakeholder_type": dd[0], "organisation": dd[1], 'name': name, 's': d.finalScore, 'r': null });
				}
			});
		});

	});

	// entries by framework sector (non-unique to populate framework cells)
	vars.dataByContext = vars.dataByContextArray;

	if(filters.frameworkToggle=='average'){
		var dataByContextNullEntries = vars.dataByContext.filter(function(d){
			if(filters.toggle=='severity'){
				return d.s==0;
			} else {
				return d.r==0
			}
		});
		vars.dataByContext = vars.dataByContext.filter(function(d){
			if(filters.toggle=='severity'){
				return d.s>0;
			} else {
				return d.r>0;
			}
		});
	} 

	if(filters.time=='d'){

		vars.dataByContext = d3.nest()
		.key(function(d) { return d.date; })
		.key(function(d) { return d.context; })
		.rollup(function(leaves) { 
			return { 
				'median_r': d3.median(leaves, function(d,i){return d.r;}), 
				'median_s': d3.median(leaves, function(d,i){return d.s;}), 
				'total': leaves.length, 
			}
		})		
		.entries(vars.dataByContext);	

	}

	if(filters.time=='m'){

		vars.dataByLocation = d3.nest()
		.key(function(d) { return d.month;})
		.key(function(d) { return d.geo; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(vars.dataByLocationArray);

		vars.dataByContext = d3.nest()
		.key(function(d) { return d.month; })
		.key(function(d) { return d.context; })
		.rollup(function(leaves) { 
			return { 
				'median_r': d3.median(leaves, function(d,i){return d.r;}), 
				'median_s': d3.median(leaves, function(d,i){return d.s;}), 
				'total': leaves.length, 
			}
		})		
		.entries(vars.dataByContext);		
	}

	if(filters.time=='y'){

		vars.dataByLocation = d3.nest()
		.key(function(d) { return d.year;})
		.key(function(d) { return d.geo; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(vars.dataByLocationArray);

		vars.dataByContext = d3.nest()
		.key(function(d) { return d.year; })
		.key(function(d) { return d.context; })
		.rollup(function(leaves) { 
			return { 
				'median_r': d3.median(leaves, function(d,i){return d.r;}), 
				'median_s': d3.median(leaves, function(d,i){return d.s;}), 
				'total': leaves.length, 
			}
		})		
		.entries(vars.dataByContext);	
	}

	vars.maxContextValue = d3.max(vars.dataByContext, function(d) {
		var m = d3.max(d.values, function(d) {
			return d.value.total;
		})
		if(new Date(d.key)<=new Date(vars.maxDate)){
			return m;
		}
	});

	vars.scale.eventdrop = d3.scaleLinear()
	.range([0,12])
	.domain([0,vars.maxContextValue]);

	vars.trendlinePoints = [];
	vars.tp = [];

	vars.dataByLocation.forEach(function(d,i){
		var dt = new Date(d.key);
		dt.setHours(0,0,0,0);
		d.date = d.key;
	});

	vars.dataByDate.forEach(function(d,i){
		var dt = new Date(d.key);
		dt.setHours(0,0,0,0);
		d.key = dt;
		d.date = d.key;

		var count = 0;

		d.severity = [0,0,0,0,0,0];

		d.values.forEach(function(dx){
			d.severity[dx.key] = dx.value;
			count += dx.value;
		});

		d.reliability = [0,0,0,0,0,0];

		vars.dateByReliability[i].values.forEach(function(dx){
			d.reliability[dx.key] = dx.value;
		});

		// set up empty context array for data loop
		var contextArr = [];
		var numContextRows = vars.metadata.context_array.length;

		for(var b=0; b<=numContextRows-1; b++){
			contextArr[b] = {'median_r': null, 'median_s': null, 'total': 0 };
		}

		d.context = contextArr;

		vars.dataByContext[i] && vars.dataByContext[i].values.forEach(function(dx, ii){
			var k = dx.key-1;
			contextArr[k] = dx.value;
		});

		d.context = contextArr;

	    // geo array
	    var geoArr = [];

    	vars.dataByLocation.forEach(function(dl,ii){
    		if(dl.key==d.key){
			    dl.values.forEach(function(dx, ii){
			    	var k = dx.key-1;
			    	geoArr[k] = dx.value;
			    });
    		}
    	})

	    d.geo = geoArr;

	    d.total_entries = count;

	    d.severity_avg = ( (1*d.severity[1]) + (2*d.severity[2]) + (3*d.severity[3]) + (4*d.severity[4]) + (5*d.severity[5]) ) / count;
	    d.reliability_avg = ( (1*d.reliability[1]) + (2*d.reliability[2]) + (3*d.reliability[3]) + (4*d.reliability[4]) + (5*d.reliability[5]) ) / count;
	    // without null
	    d.trendline_severity_avg = ( (1*d.severity[1]) + (2*d.severity[2]) + (3*d.severity[3]) + (4*d.severity[4]) + (5*d.severity[5]) ) / (count- parseInt(d.severity[0]))   ;
	    d.trendline_reliability_avg = ( (1*d.reliability[1]) + (2*d.reliability[2]) + (3*d.reliability[3]) + (4*d.reliability[4]) + (5*d.reliability[5]) ) / (count- parseInt(d.reliability[0])) ;

	    if((count-parseInt(d.severity[0]))==0){
	    	d.trendline_severity_avg = null;
	    }
	    if((count-parseInt(d.reliability[0]))==0){
	    	d.trendline_reliability_avg = null;
	    }

	    vars.trendlinePoints.push({date: d.date, "severity_avg": d.trendline_severity_avg, "reliability_avg": d.trendline_reliability_avg });
	    vars.dataByDate[i].barValues = d[filters.toggle];

	    delete d.values;
	});

	vars.dataByDate.sort(function(x,y){
		return d3.ascending(x.date, y.date);
	})

	vars.dataByLocation.sort(function(x,y){
		return d3.ascending(x.date, y.date);
	})

	vars.maxValue = d3.max(vars.dataByDate, function(d) {
		return d.total_entries;
	});



}