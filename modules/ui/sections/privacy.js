import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';


export function uiSectionPrivacy(context) {
  const section = uiSection('preferences-third-party', context)
    .label(t.html('preferences.privacy.title'))
    .disclosureContent(renderDisclosureContent);

  let _showThirdPartyIcons = prefs('preferences.privacy.thirdpartyicons') || 'true';

  function renderDisclosureContent(selection) {
    // enter
    let privacyOptionsListEnter = selection.selectAll('.privacy-options-list')
      .data([0])
      .enter()
      .append('ul')
      .attr('class', 'layer-list privacy-options-list');

    let thirdPartyIconsEnter = privacyOptionsListEnter
      .append('li')
      .attr('class', 'privacy-third-party-icons-item')
      .append('label')
      .call(uiTooltip()
        .title(t.html('preferences.privacy.third_party_icons.tooltip'))
        .placement('bottom')
      );

    thirdPartyIconsEnter
      .append('input')
      .attr('type', 'checkbox')
      .on('change', d3_event => {
        d3_event.preventDefault();
        _showThirdPartyIcons = (_showThirdPartyIcons === 'true') ? 'false' : 'true';
        prefs('preferences.privacy.thirdpartyicons', _showThirdPartyIcons);
        update();
      });

    thirdPartyIconsEnter
      .append('span')
      .html(t.html('preferences.privacy.third_party_icons.description'));


    // Privacy Policy link
    selection.selectAll('.privacy-link')
      .data([0])
      .enter()
      .append('div')
      .attr('class', 'privacy-link')
      .append('a')
      .attr('target', '_blank')
      .call(svgIcon('#rapid-icon-out-link', 'inline'))
      .attr('href', 'https://mapwith.ai/doc/license/MapWithAIPrivacyPolicy.pdf')
      .append('span')
      .html(t.html('preferences.privacy.privacy_link'));

    update();


    function update() {
      selection.selectAll('.privacy-third-party-icons-item')
        .classed('active', (_showThirdPartyIcons === 'true'))
        .select('input')
        .property('checked', (_showThirdPartyIcons === 'true'));
    }
  }

  return section;
}
