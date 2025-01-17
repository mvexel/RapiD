import * as PIXI from 'pixi.js';

import { services } from '../services';
import { t } from '../core/localizer';


export function uiOsmoseHeader() {
  let _qaItem;

  function issueTitle(d) {
    const unknown = t('inspector.unknown');
    if (!d) return unknown;

    // Issue titles supplied by Osmose
    const s = services.osmose.getStrings(d.itemType);
    return ('title' in s) ? s.title : unknown;
  }


  function osmoseHeader(selection) {
    let iconFill = 0xffffff;
    const service = services.osmose;
    if (service) {
      iconFill = service.getColor(_qaItem?.item);
    }

    const header = selection.selectAll('.qa-header')
      .data(
        (_qaItem ? [_qaItem] : []),
        d => `${d.id}-${d.status || 0}`
      );

    header.exit()
      .remove();

    const headerEnter = header.enter()
      .append('div')
      .attr('class', 'qa-header');

    const svgEnter = headerEnter
      .append('div')
      .attr('class', 'qa-header-icon')
      .append('svg')
      .attr('width', '20px')
      .attr('height', '27px')
      .attr('viewbox', '0 0 20 27')
      .attr('class', d => `qaItem ${d.service}`);

    svgEnter
      .append('polygon')
      .attr('fill', PIXI.utils.hex2string(iconFill))
      .attr('stroke', '#333')
      .attr('points', '16,3 4,3 1,6 1,17 4,20 7,20 10,27 13,20 16,20 19,17.033 19,6');

    svgEnter
      .append('use')
      .attr('class', 'icon-annotation')
      .attr('width', '13px')
      .attr('height', '13px')
      .attr('transform', 'translate(3.5, 5)')
      .attr('xlink:href', d => d.icon ? `#${d.icon}` : '');

    headerEnter
      .append('div')
      .attr('class', 'qa-header-label')
      .html(issueTitle);
  }

  osmoseHeader.issue = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return osmoseHeader;
  };

  return osmoseHeader;
}
