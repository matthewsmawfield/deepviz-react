import React from 'react';
import * as d3 from 'd3';
import addCommas from '../../usefulFunctions.js';
import {filters} from '../../Filters.js';
import {filter} from '../../Filter.js';
import {vars} from '../../Vars.js';
import './Summary.css';
import {ReactComponent as Summary_entries_1} from './summary_entries_1.svg';  
import {ReactComponent as Summary_entries_2} from './summary_entries_2.svg';  
import {ReactComponent as Summary_entries_3} from './summary_entries_3.svg';  
import {ReactComponent as Summary_assessments_1} from './summary_assessments_1.svg';  
import {ReactComponent as Summary_assessments_2} from './summary_assessments_2.svg';  
import {ReactComponent as Summary_assessments_3} from './summary_assessments_3.svg';    

export default class Summary extends React.Component {

  constructor() {
    super();
    if(vars.mode=='entries'){
        this.summary1 = Summary_entries_1;
        this.summary2 = Summary_entries_2;
        this.summary3 = Summary_entries_3;
    } else {
        this.summary1 = Summary_assessments_1;
        this.summary2 = Summary_assessments_2;
        this.summary3 = Summary_assessments_3;
    }
  }

  componentDidMount() {
    this.init();
  }

  init() {

    d3.selectAll('#summary svg tspan').attr('class', function(d,i){
      var t = d3.select(this).text();
      if(t.includes('00')){
        return 'summary-value';
      } else {
        return 'summary-label'
      }
    });

    d3.selectAll('#summary svg tspan').attr('data-x', function(d,i){
      var t = d3.select(this).text();
      if(!t.includes('00')){
        return d3.select(this).attr('x');
      } 
    });

    // topline filters (assessment registry only)
    vars.topFilters = [
      {'name': 'coordination_5_box', 'filterFn': function(){ filter('top', 'coordination_5' ); }}, 
      {'name': 'coordination_2_box', 'filterFn': function(){ filter('top', 'coordination_2' ); }}, 
      {'name': 'coordination_1_box', 'filterFn': function(){ filter('top', 'coordination_1' ); }}, 
      {'name': 'harmonized_box', 'filterFn': function(){ filter('top', 'harmonized') }}, 
      {'name': 'uncoordinated_box', 'filterFn': function(){ filter('top', 'uncoordinated') }}, 
      {'name': 'lngo_box', 'filterFn': function(){ filter('top', 'lngo') }}, 
      {'name': 'ingo_box', 'filterFn': function(){ filter('top', 'ingo') }}, 
      {'name': 'un_agency_box', 'filterFn': function(){ filter('top', 'un_agency') }}, 
      {'name': 'cluster_box', 'filterFn': function(){ filter('top', 'cluster') }}, 
      {'name': 'donor_box', 'filterFn': function(){ filter('top', 'donor') }}, 
      {'name': 'rcrc_box', 'filterFn': function(){ filter('top', 'rcrc') }}, 
      {'name': 'government_box', 'filterFn': function(){ filter('top', 'government') }},
      {'name': 'community_group_discussion_box', 'filterFn': function(){ filter('top', 'community_group_discussion' ) }},
      {'name': 'focus_group_discussion_box', 'filterFn': function(){ filter('top', 'focus_group_discussion' ) }},
      {'name': 'key_informant_interview_box', 'filterFn': function(){ filter('top', 'key_informant_interview' )}},
      {'name': 'monitoring_5_box', 'filterFn': function(){ filter('top', 'monitoring_5' ) }},
      {'name': 'monitoring_2_box', 'filterFn': function(){ filter('top', 'monitoring_2' ) }},
      {'name': 'monitoring_1_box', 'filterFn': function(){ filter('top', 'monitoring_1' ) }},
      {'name': 'in_depth_box', 'filterFn': function(){ filter('top', 'in_depth') }},
      {'name': 'initial_box', 'filterFn': function(){ filter('top', 'initial') }},
      {'name': 'rapid_box', 'filterFn': function(){ filter('top', 'rapid')}},
      {'name': 'sector_1_box', 'filterFn': function(){ filter('top', 'sector_1' ) }},
      {'name': 'sector_2_box', 'filterFn': function(){ filter('top', 'sector_2' ) }},
      {'name': 'sector_5_box', 'filterFn': function(){ filter('top', 'sector_5' ) }}
    ];

    vars.topFilters.forEach(function(d,i){
      var name = d.name.slice(0,-4);
      var f = 'filter_'+ name;
      d3.select('#'+f).style('opacity', 0.01).attr('class', 'top_filter');
    });
    
    this.update();
  }

  update() {

    var dcEntries = vars.data.filter(function(d){return ((d.date>=vars.dateRange[0])&&(d.date<vars.dateRange[1])) ;});
    var dc = vars.dataAssessments.filter(function(d){return ((d.date>=vars.dateRange[0])&&(d.date<vars.dateRange[1])) ;});
    var context = [];

    var individuals = d3.sum(dc, d => d.individuals);
    var households = d3.sum(dc, d => d.households);

    // total entries
    vars.total = d3.sum(vars.dataByDate, function(d){
      if((d.date>=vars.dateRange[0])&&(d.date<vars.dateRange[1]))
        return d.total_entries;
    });

    d3.select('#total_entries tspan').text(addCommas(vars.total));

    var uniqueLeads = [];
    vars.dataByLead.forEach(function(d,i){
      if((d.date>=vars.dateRange[0])&&(d.date<vars.dateRange[1])){
        if(!uniqueLeads.includes(d.lead_id)){
          uniqueLeads.push(d.lead_id)
        }
      }
    });

    var totalLeads = uniqueLeads.length;
    d3.select('#total_documents tspan').text(addCommas(totalLeads));

    // publishers
    var uniquePublishers = [];
    vars.dataByPublisher.forEach(function(d,i){
      if((d.date>=vars.dateRange[0])&&(d.date<vars.dateRange[1])){
        if(!uniquePublishers.includes(d.publisher_str)){
          uniquePublishers.push(d.publisher_str)
        }
      }
    });

    var totalPublishers = uniquePublishers.length;

    d3.select('#total_publishers tspan').text(addCommas(totalPublishers));

    var totalAssessments = dc.length;

    // other documents
    d3.select('#total_other_documents tspan').text(addCommas(Math.max(0,(totalLeads-totalAssessments))));

    var mutli_sector_5 = d3.sum(dc, function(d){
      if(d.sector_count>=5)
        return 1;
    });

    var mutli_sector_2 = d3.sum(dc, function(d){
      if(d.sector_count>=2)
        return 1;
    });

    var single_sector = d3.sum(dc, function(d){
      if(d.sector_count==1)
        return 1;
    });

    // coordinated totals
    var coordinated_5 = d3.sum(dc, function(d){
      if((d.sector_count>=5)&&((d.coordination==vars.coordinatedJointId)||(d.coordination==vars.coordinatedHarmonizedId)))
        return 1;
    });

    var coordinated_2 = d3.sum(dc, function(d){
      if((d.sector_count>=2)&&((d.coordination==vars.coordinatedJointId)||(d.coordination==vars.coordinatedHarmonizedId)))
        return 1;
    });

    var coordinated_1 = d3.sum(dc, function(d){
      if((d.sector_count==1)&&((d.coordination==vars.coordinatedJointId)||(d.coordination==vars.coordinatedHarmonizedId)))
        return 1;
    });

    // harmonized total
    var harmonized = d3.sum(dc, function(d){
      if(d.coordination==vars.coordinatedHarmonizedId)
        return 1;
    });

    // uncoordianted total
    var uncoordinated = d3.sum(dc, function(d){
      if(d.coordination==vars.uncoordinatedId)
        return 1;
    });

    // sector monitoring totals
    var sector_monitoring_5 = d3.sum(dc, function(d){
      if((d.sector_count>=5)&&(d.assessment_type==vars.atype_keys.monitoring))
        return 1;
    });

    var sector_monitoring_2 = d3.sum(dc, function(d){
      if((d.sector_count>=2)&&(d.assessment_type==vars.atype_keys.monitoring))
        return 1;
    });

    var sector_monitoring_1 = d3.sum(dc, function(d){
      if((d.sector_count==1)&&(d.assessment_type==vars.atype_keys.monitoring))
        return 1;
    });

    d3.select('#total_assessments tspan').text(addCommas(totalAssessments));
    d3.select('#coordinated_5_sector tspan').text(addCommas(coordinated_5));
    d3.select('#coordinated_2_sector tspan').text(addCommas(coordinated_2));
    d3.select('#coordinated_1_sector tspan').text(addCommas(coordinated_1));
    d3.select('#harmonized tspan').text(addCommas(harmonized));
    d3.select('#uncoordinated tspan').text(addCommas(uncoordinated));
    
    d3.select('#total_stakeholders tspan').text(0);
    d3.select('#lngo tspan').text(0);
    d3.select('#ingo tspan').text(0);
    d3.select('#un_agency tspan').text(0);
    d3.select('#cluster tspan').text(0);
    d3.select('#donor tspan').text(0);
    d3.select('#rcrc tspan').text(0);
    d3.select('#government tspan').text(0);

    d3.select('#mutli_sector_5 tspan').text(addCommas(mutli_sector_5));
    d3.select('#multi_sector_2 tspan').text(addCommas(mutli_sector_2));
    d3.select('#single_sector tspan').text(addCommas(single_sector));
    d3.select('#sector_monitoring_5 tspan').text(addCommas(sector_monitoring_5));
    d3.select('#sector_monitoring_2 tspan').text(addCommas(sector_monitoring_2));
    d3.select('#sector_monitoring_1 tspan').text(addCommas(sector_monitoring_1));
    d3.select('#total_initial tspan').text(0);
    d3.select('#total_rapid tspan').text(0);
    d3.select('#total_in_depth tspan').text(0);

    d3.select('#individuals tspan').text(addCommas(individuals));
    d3.select('#households tspan').text(addCommas(households));
    d3.select('#key_informants tspan').text(0);
    d3.select('#focus_group_discussions tspan').text(0);
    d3.select('#community_group_discussions tspan').text(0);

    // assessment types row
    var assessmentTypes = vars.dataByAssessmentType.filter(function(d){return ((d.date>=vars.dateRange[0])&&(d.date<vars.dateRange[1])) ;});
    assessmentTypes = d3.nest()
    .key(function(d){ return d.assessment_type; })
    .rollup(function(leaves){ 
      return leaves.length;
    })
    .entries(assessmentTypes);

    assessmentTypes.forEach(function(d,i){
      d.key = parseInt(d.key);

      // initial assessments
      if(d.key==vars.atype_keys.initial){
        d3.select('#total_initial tspan').text(addCommas(d.value));
      } 

      // rapid assessments
      if(d.key==vars.atype_keys.rapid){
        d3.select('#total_rapid tspan').text(addCommas(d.value));
      } 

      // in-depth assessments
      if(d.key==vars.atype_keys.in_depth){
        d3.select('#total_in_depth tspan').text(addCommas(d.value));
      } 
    });

    // stakeholder row
    var organisations = vars.dataByOrganisation.filter(function(d){return ((d.date>=vars.dateRange[0])&&(d.date<vars.dateRange[1])) ;});
    var uniqueOrganisations = [];
    var stakeholderTypes = [];

    organisations.forEach(function(d,i){
      if(!uniqueOrganisations.includes(d.organisation)){
        uniqueOrganisations.push(d.organisation);
        if(d.stakeholder_type!=null) stakeholderTypes.push(d.stakeholder_type);
      }
    });

    d3.select('#total_stakeholders tspan').text(addCommas(uniqueOrganisations.length));

    // STAKEHOLDERS ROW
    var lngo = d3.sum(dc, function(d){
      if(d.top.includes('lngo')) return 1;
    })
    d3.select('#lngo tspan').text(addCommas(lngo));

    var ingo = d3.sum(dc, function(d){
      if(d.top.includes('ingo')) return 1;
    })
    d3.select('#ingo tspan').text(addCommas(ingo));

    var un_agency = d3.sum(dc, function(d){
      if(d.top.includes('un_agency')) return 1;
    })
    d3.select('#un_agency tspan').text(addCommas(un_agency));

    var cluster = d3.sum(dc, function(d){
      if(d.top.includes('cluster')) return 1;
    })
    d3.select('#cluster tspan').text(addCommas(cluster));

    var donor = d3.sum(dc, function(d){
      if(d.top.includes('donor')) return 1;
    })
    d3.select('#donor tspan').text(addCommas(donor));

    var rcrc = d3.sum(dc, function(d){
      if(d.top.includes('rcrc')) return 1;
    })
    d3.select('#rcrc tspan').text(addCommas(rcrc));

    var government = d3.sum(dc, function(d){
      if(d.top.includes('government')) return 1;
    })
    d3.select('#government tspan').text(addCommas(government));

    // BOTTOM ROW
    var key_informants = d3.sum(dc,function(d){
      if(d.top.includes('key_informant_interview')) return d.data_collection_technique_sample_size[vars.data_collection_technique_keys.key_informant_interview]
    })
    d3.select('#key_informants tspan').text(addCommas(key_informants));

    var focus_group_discussion = d3.sum(dc,function(d){
      if(d.top.includes('focus_group_discussion')) return 1;
    })
    d3.select('#focus_group_discussions tspan').text(addCommas(focus_group_discussion));

    var community_group_discussion = d3.sum(dc,function(d){
      if(d.top.includes('community_group_discussion')) return 1;
    })
    d3.select('#community_group_discussions tspan').text(addCommas(community_group_discussion));

    // spacing
    var boxes = d3.selectAll('#summary svg g').filter(function(d,i){
      var t = d3.select(this).attr('id');
      return t.includes('_box');
    });

    boxes.each(function(d,i){
      var valueWidth = d3.select(this).select('.summary-value').node().getBBox().width;
      d3.select(this).selectAll('.summary-label').attr('x',function(d,i){
        if(d3.select(this).text().includes('=')){
            return valueWidth+110;    
          } else {
            return valueWidth+13;           
          }
      });
    });
  }

  render() {
    const Summary1 = this.summary1;
    const Summary2 = this.summary2;
    const Summary3 = this.summary3;
    return (
      <div id="summary">
        <div id="svg_summary1_div"><Summary1 width="100%"/></div>
        <div id="svg_summary2_div"><Summary2 width="100%"/></div>
        <div id="svg_summary3_div"><Summary3 width="100%"/></div>
      </div>
    );
  }
}
