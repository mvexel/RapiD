import { AbstractMode } from './AbstractMode';
import { osmNote } from '../osm/note';
import { services } from '../services';

const DEBUG = false;


/**
 * `ModeAddNote`
 * In this mode, we are waiting for the user to place a Note somewhere
 */
export class ModeAddNote extends AbstractMode {

  /**
   * @constructor
   * @param  `context`  Global shared application context
   */
  constructor(context) {
    super(context);

    this.id = 'add-note';

    // Make sure the event handlers have `this` bound correctly
    this._click = this._click.bind(this);
    this._cancel = this._cancel.bind(this);
  }


  /**
   * enter
   */
  enter() {
    if (DEBUG) {
      console.log('ModeAddNote: entering');  // eslint-disable-line no-console
    }

    this._active = true;
    const context = this.context;
    context.enableBehaviors(['hover', 'draw', 'map-interaction', 'map-nudging']);

    context.behaviors.get('draw')
      .on('click', this._click)
      .on('cancel', this._cancel)
      .on('finish', this._cancel);

    context.history().on('undone.ModeAddNote redone.ModeAddNote', this._cancel);

    context.behaviors.get('map-nudging').allow();

    return true;
  }


  /**
   * exit
   */
  exit() {
    if (!this._active) return;
    this._active = false;

    if (DEBUG) {
      console.log('ModeAddNote: exiting');  // eslint-disable-line no-console
    }

    const context = this.context;
    context.behaviors.get('draw')
      .off('click', this._click)
      .off('cancel', this._cancel)
      .off('finish', this._cancel);

    context.history().on('undone.ModeAddNote redone.ModeAddNote', null);
  }


  /**
   * _click
   * Add a Note at the mouse click coords
   */
  _click(eventData) {
    const context = this.context;
    const osm = services.osm;
    const projection = context.projection;
    const coord = eventData.coord;
    const loc = projection.invert(coord);

    if (!osm) return;

    const note = osmNote({ loc: loc, status: 'open', comments: [] });
    osm.replaceNote(note);

    const selection = new Map().set(note.id, note);
    context.enter('select', { selection: selection });
  }


  /**
   * _cancel
   * Return to browse mode without doing anything
   */
  _cancel() {
    this.context.enter('browse');
  }
}
