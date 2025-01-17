import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';


export function uiDataHeader() {
    var _datum;


    function dataHeader(selection) {
        var header = selection.selectAll('.data-header')
            .data(
                (_datum ? [_datum] : []),
                function(d) { return d.__featurehash__; }
            );

        header.exit()
            .remove();

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'data-header');

        var iconEnter = headerEnter
            .append('div')
            .attr('class', 'data-header-icon');

        iconEnter
            .append('div')
            .call(svgIcon('#rapid-icon-data', 'note-fill'));

        headerEnter
            .append('div')
            .attr('class', 'data-header-label')
            .html(t.html('map_data.layers.custom.title'));
    }


    dataHeader.datum = function(val) {
        if (!arguments.length) return _datum;
        _datum = val;
        return this;
    };


    return dataHeader;
}
