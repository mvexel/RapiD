import { t } from '../../core/localizer';
import { uiPane } from '../pane';

import { uiSectionDataLayers } from '../sections/data_layers';
import { uiSectionMapFeatures } from '../sections/map_features';
import { uiSectionMapStyleOptions } from '../sections/map_style_options';
import { uiSectionPhotoOverlays } from '../sections/photo_overlays';


export function uiPaneMapData(context) {
  let mapDataPane = uiPane('map-data', context)
    .key(t('map_data.key'))
    .label(t.html('map_data.title'))
    .description(t.html('map_data.description'))
    .iconName('rapid-icon-data')
    .sections([
      uiSectionDataLayers(context),
      uiSectionPhotoOverlays(context),
      uiSectionMapStyleOptions(context),
      uiSectionMapFeatures(context)
    ]);

  return mapDataPane;
}
