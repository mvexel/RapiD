import _debounce from 'lodash-es/debounce';
import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';


export function uiContributors(context) {
    var osm = context.connection();
    var debouncedUpdate = _debounce(function() { update(); }, 1000);
    var limit = 4;
    var hidden = false;
    var wrap = d3_select(null);


    function update() {
        if (!osm) return;

        var users = {},
            entities = context.history().intersects(context.map().extent());

        entities.forEach(function(entity) {
            if (entity && entity.user) users[entity.user] = true;
        });

        var u = Object.keys(users),
            subset = u.slice(0, u.length > limit ? limit - 1 : limit);

        wrap.html('')
            .call(svgIcon('#rapid-icon-nearby', 'pre-text light'));

        var userList = d3_select(document.createElement('span'));

        userList.selectAll()
            .data(subset)
            .enter()
            .append('a')
            .attr('class', 'user-link')
            .attr('href', function(d) { return osm.userURL(d); })
            .attr('target', '_blank')
            .html(String);

        if (u.length > limit) {
            var count = d3_select(document.createElement('span'));

            var othersNum = u.length - limit + 1;

            count.append('a')
                .attr('target', '_blank')
                .attr('href', function() {
                    return osm.changesetsURL(context.map().center(), context.map().zoom());
                })
                .html(othersNum);

            wrap.append('span')
                .html(t.html('contributors.truncated_list', { n: othersNum, users: userList.html(), count: count.html() }));

        } else {
            wrap.append('span')
                .html(t.html('contributors.list', { users: userList.html() }));
        }

        if (!u.length) {
            hidden = true;
            wrap
                .transition()
                .style('opacity', 0);

        } else if (hidden) {
            wrap
                .transition()
                .style('opacity', 1);
        }
    }


    return function(selection) {
        if (!osm) return;
        wrap = selection;
        update();

        osm.on('loaded.contributors', debouncedUpdate);
        context.map().on('draw', debouncedUpdate);
    };
}
