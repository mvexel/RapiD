import { select as d3_select } from 'd3-selection';

import { uiDisclosure } from './disclosure';
import { utilFunctor } from '../util';


// A unit of controls or info to be used in a layout, such as within a pane.
// Can be labeled and collapsible.
export function uiSection(sectionID, context) {
  let _classes = utilFunctor('');
  let _shouldDisplay;
  let _content;

  let _disclosure;
  let _label;
  let _expandedByDefault = utilFunctor(true);
  let _disclosureContent;
  let _disclosureExpanded;

  let _containerSelection = d3_select(null);

  let section = {
    id: sectionID
  };

  section.classes = function(val) {
    if (!arguments.length) return _classes;
    _classes = utilFunctor(val);
    return section;
  };

  section.label = function(val) {
    if (!arguments.length) return _label;
    _label = utilFunctor(val);
    return section;
  };

  section.expandedByDefault = function(val) {
    if (!arguments.length) return _expandedByDefault;
    _expandedByDefault = utilFunctor(val);
    return section;
  };

  section.shouldDisplay = function(val) {
    if (!arguments.length) return _shouldDisplay;
    _shouldDisplay = utilFunctor(val);
    return section;
  };

  section.content = function(val) {
    if (!arguments.length) return _content;
    _content = val;
    return section;
  };

  section.disclosureContent = function(val) {
    if (!arguments.length) return _disclosureContent;
    _disclosureContent = val;
    return section;
  };

  section.disclosureExpanded = function(val) {
    if (!arguments.length) return _disclosureExpanded;
    _disclosureExpanded = val;
    return section;
  };

  // may be called multiple times
  section.render = function(selection) {
    _containerSelection = selection
      .selectAll(`.section-${sectionID}`)
      .data([0]);

    let sectionEnter = _containerSelection
      .enter()
      .append('div')
      .attr('class', `section section-${sectionID} ` + (_classes && _classes() || ''));

    _containerSelection = sectionEnter
      .merge(_containerSelection);

    _containerSelection
      .call(renderContent);
  };

  section.reRender = function() {
    _containerSelection
      .call(renderContent);
  };

  section.selection = function() {
    return _containerSelection;
  };

  section.disclosure = function() {
    return _disclosure;
  };


  // may be called multiple times
  function renderContent(selection) {
    if (_shouldDisplay) {
      const shouldDisplay = _shouldDisplay();
      selection.classed('hide', !shouldDisplay);
      if (!shouldDisplay) {
        selection.html('');
        return;
      }
    }

    if (_disclosureContent) {
      if (!_disclosure) {
        _disclosure = uiDisclosure(context, sectionID.replace(/-/g, '_'), _expandedByDefault())
          .label(_label || '')
          /*.on('toggled', function(expanded) {
              if (expanded) { selection.node().parentNode.scrollTop += 200; }
          })*/
          .content(_disclosureContent);
      }
      if (_disclosureExpanded !== undefined) {
        _disclosure.expanded(_disclosureExpanded);
        _disclosureExpanded = undefined;
      }
      selection
        .call(_disclosure);

      return;
    }

    if (_content) {
      selection
        .call(_content);
    }
  }

  return section;
}
