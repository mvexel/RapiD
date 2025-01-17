import * as PIXI from 'pixi.js';
import { DashLine } from '@rapideditor/pixi-dashed-line';
import { GlowFilter } from 'pixi-filters';

import { AbstractFeature } from './AbstractFeature';
import { getIconTexture } from './helpers';


/**
 * PixiFeaturePoint
 *
 * Properties you can access:
 *   `geometry`    PixiGeometry() class containing all the information about the geometry
 *   `style`       Object containing styling data
 *   `container`   PIXI.Container containing the display objects used to draw the point
 *   `viewfields`  PIXI.Container that contains viewfields
 *   `marker`      PIXI.Sprite for the marker
 *   `icon`        PIXI.Sprite for the icon
 *
 *   (also all properties inherited from `AbstractFeature`)
 */
export class PixiFeaturePoint extends AbstractFeature {

  /**
   * @constructor
   * @param  layer       The Layer that owns this Feature
   * @param  featureID   Unique string to use for the name of this Feature
   */
  constructor(layer, featureID) {
    super(layer, featureID);

    this.type = 'point';
    this._oldvfLength = 0;      // to watch for change in # of viewfield sprites
    this._isCircular = false;   // set true to use a circular halo and hit area

    const viewfields = new PIXI.Container();
    viewfields.name = 'viewfields';
    viewfields.interactive = false;
    viewfields.interactiveChildren = false;
    viewfields.sortableChildren = false;
    viewfields.visible = false;
    this.viewfields = viewfields;

    const marker = new PIXI.Sprite();
    marker.name = 'marker';
    marker.interactive = false;
    marker.interactiveChildren = false;
    marker.sortableChildren = false;
    marker.visible = true;
    this.marker = marker;

    const icon = new PIXI.Sprite();
    icon.name = 'icon';
    icon.interactive = false;
    icon.interactiveChildren = false;
    icon.sortableChildren = false;
    icon.visible = false;
    this.icon = icon;

    this.container.addChild(viewfields, marker, icon);
  }


  /**
   * destroy
   * Every Feature should have a destroy function that frees all the resources
   * Do not use the Feature after calling `destroy()`.
   */
  destroy() {
    super.destroy();
    this.viewfields = null;
    this.marker = null;
    this.icon = null;
  }


  /**
   * update
   * @param  projection  Pixi projection to use for rendering
   * @param  zoom        Effective zoom to use for rendering
   */
  update(projection, zoom) {
    if (!this.dirty) return;  // nothing to do

    this.updateGeometry(projection, zoom);
    this.updateStyle(zoom);

    // Recalculate local and scene bounds
    // (note that the local bounds automatically includes children like viewfields too)
    const position = this.container.position;
    this.sceneBounds = this.container.getLocalBounds().clone();  // where 0,0 is the origin of the object
    this.sceneBounds.x += position.x;
    this.sceneBounds.y += position.y;

    this.updateHitArea();
    this.updateHalo();
  }


  /**
   * updateGeometry
   * @param  projection   Pixi projection to use for rendering
   * @param  zoom        Effective zoom to use for rendering
   */
  updateGeometry(projection, zoom) {
    if (!this.geometry.dirty) return;

    // Reproject
    this.geometry.update(projection, zoom);

    const [x, y] = this.geometry.coords;
    this.container.position.set(x, y);

    // sort markers by latitude ascending
    // sort markers with viewfields above markers without viewfields
    const z = -this.geometry.origCoords[1];  // latitude
    this.container.zIndex = (this._oldvfLength > 0) ? (z + 1000) : z;
  }


  /**
   * updateStyle
   * @param  zoom  Effective zoom to use for rendering
   */
  updateStyle(zoom) {
    if (!this._styleDirty) return;

    const context = this.context;
    const wireframeMode = context.map().wireframeMode;
    const textures = context.pixi.rapidTextures;
    const style = this._style;
    const isPin = ['pin', 'boldPin', 'improveosm', 'osmose'].includes(style.markerName);

    const viewfields = this.viewfields;
    const marker = this.marker;
    const icon = this.icon;
    const latitude = this.geometry.origCoords[1];

    //
    // Update marker style
    //
    marker.texture = style.markerTexture || textures.get(style.markerName) || PIXI.Texture.WHITE;
    marker.tint = style.markerTint;

    //
    // Update viewfields, if any..
    //
    const vfAngles = style.viewfieldAngles || [];
    if (vfAngles.length) {
      const vfTexture = style.viewfieldTexture || textures.get(style.viewfieldName) || PIXI.Texture.WHITE;

      // sort markers with viewfields above markers without viewfields
      this.container.zIndex = -latitude + 1000;

      // If # of viewfields has changed from before, replace them.
      if (vfAngles.length !== this._oldvfLength) {
        viewfields.removeChildren();
        vfAngles.forEach(() => {
          const vfSprite = new PIXI.Sprite(vfTexture);
          vfSprite.interactive = false;
          vfSprite.interactiveChildren = false;
          vfSprite.anchor.set(0.5, 0.5);  // middle, middle
          viewfields.addChild(vfSprite);
        });
        this._oldvfLength = vfAngles.length;
      }

      // Update viewfield angles and style
      vfAngles.forEach((vfAngle, index) => {
        const vfSprite = viewfields.getChildAt(index);
        vfSprite.tint = style.viewfieldTint || 0x333333;
        vfSprite.angle = vfAngle;
      });

      viewfields.visible = true;

    } else {  // No viewfields
      this.container.zIndex = -latitude;   // restore default marker sorting
      viewfields.removeChildren();
      viewfields.visible = false;
    }

    //
    // Update icon, if any..
    //
    if (style.iconTexture || style.iconName) {
      // Update texture and style, if necessary
      icon.texture = style.iconTexture || getIconTexture(context, style.iconName) || PIXI.Texture.WHITE;
      const ICONSIZE = 11;
      icon.anchor.set(0.5, 0.5);   // middle, middle
      icon.width = ICONSIZE;
      icon.height = ICONSIZE;
      icon.alpha = style.iconAlpha;
      icon.visible = true;

    } else {  // No icon
      icon.visible = false;
    }


    //
    // Apply effectiveZoom style adjustments
    //
    if (zoom < 16) {  // Hide marker and everything under it
      this.lod = 0;   // off
      this.visible = false;

    } else if (zoom < 17 || wireframeMode) {  // Markers drawn but smaller
      this.lod = 1;  // simplified
      this.visible = true;
      viewfields.renderable = false;
      marker.renderable = true;
      marker.scale.set(0.8, 0.8);

      // Replace pins with circles at lower zoom
      const textureName = isPin ? 'largeCircle' : style.markerName;
      this._isCircular = (!style.markerTexture && /(circle|midpoint)$/i.test(textureName));
      marker.texture = style.markerTexture || textures.get(textureName) || PIXI.Texture.WHITE;
      marker.anchor.set(0.5, 0.5);  // middle, middle
      icon.position.set(0, 0);      // middle, middle

    } else {  // z >= 17 - Show the requested marker (circles OR pins)
      this.lod = 2;  // full
      this.visible = true;
      viewfields.renderable = true;
      marker.renderable = true;
      marker.scale.set(1, 1);

      // Replace pins with circles if viewfields are present
      const textureName = (isPin && vfAngles.length) ? 'largeCircle' : style.markerName;
      this._isCircular = (!style.markerTexture && /(circle|midpoint)$/i.test(textureName));
      marker.texture = style.markerTexture || textures.get(textureName) || PIXI.Texture.WHITE;
      if (isPin && !this._isCircular) {
        marker.anchor.set(0.5, 1);  // middle, bottom
        icon.position.set(0, -14);  // mathematically 0,-15 is center of pin, but looks nicer moved down slightly
      } else {
        marker.anchor.set(0.5, 0.5);  // middle, middle
        icon.position.set(0, 0);      // middle, middle
      }
    }

    this._styleDirty = false;
  }


// experiment
  updateHitArea() {
    if (!this.visible) return;

    //Fix for bug #648: If we're drawing, we don't need to hit ourselves.
    if (this._drawing) {
      this.container.hitArea = null;
      return;
    }

    // Recalculate hitArea, grow it if too small
    const MINSIZE = 20;
    const rect = this.marker.getLocalBounds().clone();

    if (this._isCircular) {
      let radius = rect.width / 2;
      if (radius < MINSIZE / 2) {
        radius = MINSIZE / 2;
      }
      radius = radius + 2;  // then pad a bit more

      const circle = new PIXI.Circle(0, 0, radius);
      this.container.hitArea = circle;

    } else {
      if (rect.width < MINSIZE) {
        rect.pad((MINSIZE - rect.width) / 2, 0);
      }
      if (rect.height < MINSIZE) {
        rect.pad(0, (MINSIZE - rect.height) / 2);
      }
      rect.pad(4); // then pad a bit more

      this.container.hitArea = rect;
    }
  }


  /**
   * updateHalo
   * Show/Hide halo (requires `this.container.hitArea` to be already set up by `updateHitArea` as a supported shape)
   */
  updateHalo() {
    const showHover = (this.visible && this.hovered);
    const showSelect = (this.visible && this.selected && !this.virtual);

    // Hover
    if (showHover) {
      if (!this.container.filters) {
        const glow = new GlowFilter({ distance: 15, outerStrength: 3, color: 0xffff00 });
        glow.resolution = 2;
        this.container.filters = [glow];
      }
    } else {
      if (this.container.filters) {
        this.container.filters = null;
      }
    }

    // Select
    if (showSelect) {
      if (!this.halo) {
        this.halo = new PIXI.Graphics();
        this.halo.name = `${this.id}-halo`;
        const mapUIContainer = this.scene.layers.get('map-ui').container;
        mapUIContainer.addChild(this.halo);
      }

      const HALO_STYLE = {
        alpha: 0.9,
        dash: [6, 3],
        width: 2,   // px
        color: 0xffff00
      };

      this.halo.clear();

      const shape = this.container.hitArea;
      if (shape instanceof PIXI.Circle) {
        new DashLine(this.halo, HALO_STYLE).drawCircle(shape.x, shape.y, shape.radius, 20).closePath();
      } else if (shape instanceof PIXI.Rectangle) {
        new DashLine(this.halo, HALO_STYLE).drawRect(shape.x, shape.y, shape.width, shape.height);
      }
      this.halo.position = this.container.position;

    } else {
      if (this.halo) {
        this.halo.destroy({ children: true });
        this.halo = null;
      }
    }
  }


  /**
   * style
   * @param  obj  Style `Object` (contents depends on the Feature type)
   *
   * 'point' - see PixiFeaturePoint.js
   * 'line'/'polygon' - see styles.js
   */
  get style() {
    return this._style;
  }
  set style(obj) {
    this._style = Object.assign({}, STYLE_DEFAULTS, obj);
    this._styleDirty = true;
  }

}


const STYLE_DEFAULTS = {
  markerName: 'smallCircle',
  markerTint: 0xffffff,
  viewfieldAngles: [],
  viewfieldName: 'viewfield',
  viewfieldTint: 0xffffff,
  iconName: '',
  iconAlpha: 1,
  labelTint: 0xeeeeee
};
