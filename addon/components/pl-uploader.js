import Ember from "ember";

var get = Ember.get;
var set = Ember.set;
var bool = Ember.computed.bool;
var assert = Ember.assert;
var merge = Ember.merge;
var isDragAndDropSupported;
var slice = Array.prototype.slice;
var reads = Ember.computed.reads;

var PlUploader = Ember.Component.extend(/** @scope PlUploader */{

  classNames: ['pl-uploader'],

  classNameBindings: ['isValid:valid:invalid', 'hasDragData:drag-over', 'areAnyFilesUploading:uploading'],

  dragData: false,

  name: null,

  onQueued: 'fileQueued',

  onUpload: 'fileUploaded',

  onError:  'fileUploadFailed',

  isDragAndDropSupported: function () {
    if (isDragAndDropSupported == null) {
      isDragAndDropSupported = 'draggable' in document.createElement('span');
    }
    return isDragAndDropSupported;
  }.property(),

  /**
    A cascading list of runtimes to fallback on to
    for uploading files with.

    @property runtimes
    @type String[]
    @default ['html5', 'html4', 'flash', 'silverlight']
   */
  runtimes: ['html5', 'html4', 'flash', 'silverlight'],

  extensions: [],

  params: null,

  hasDragData: bool('dragData'),

  /**
    The maxiumum file size to handle.

    @property maxSize
    @type Number
    @default null
   */
  maxiumumFileSize: null,

  queued: reads('_manager.length'),

  areAnyFilesUploading: reads('_manager.isUploading'),

  shouldShowPrompt: function () {
    return !(get(this, 'hasDragData') || get(this, 'areAnyFilesUploading'));
  }.property('hasDragData', 'areAnyFilesUploading'),

  progress: reads('_manager.progress'),

  init: function () {
    this._super();
    this._dragEnters = 0;

    var extensions = get(this, 'extensions');
    if (extensions) {
      if (extensions.w) {
        extensions = extensions.w();
      }

      set(this, 'extensions', extensions.map(function (ext) {
        return ext.toLowerCase();
      }));
    }

    if (get(this, 'name') == null) {
      assert("{{pl-uploader}} requires a 'name' attribute to work correctly.");
    }
  },

  dropTargetId: function () {
    return get(this, 'elementId');
  }.property('elementId'),

  attachUploader: function () {
    if (get(this, 'action') == null || get(this, '_manager')) {
      return;
    }

    var manager = get(this, 'fileUploadManager'),
        config  = {
          on_queued:           get(this, 'onQueued'),
          on_upload:           get(this, 'onUpload'),
          on_error:            get(this, 'onError'),
          runtimes:            get(this, 'runtimes').join(','),
          context:             get(this, 'data'),
          browse_button:       get(this, 'for'),
          url:                 get(this, 'action'),
          flash_swf_url:       this.BASE_URL + 'Moxie.swf',
          silverlight_xap_url: this.BASE_URL + 'Moxie.xap',
          filters: {},
          multipart_params: {},
          headers: {
            Accept: 'application/json,text/javascript'
          }
        };

    if (isDragAndDropSupported) {
      config.drop_element = get(this, 'dropTargetId');
    }
    config.container = get(this, 'elementId');

    if (get(this, 'extensions.length')) {
      config.filters.mime_types = [{ extensions: get(this, 'extensions').join(',') }];
    }
    if (get(this, 'maximumFileSize')) {
      config.filters.max_file_size = get(this, 'maximumFileSize');
    }

    merge(config.multipart_params, get(this, 'params'));
    set(this, '_manager', manager.find(get(this, 'name'), config));
    this._queued = get(this, '_manager.length');
  }.observes('action').on('didInsertElement'),

  willDestroyElement: function () {
    var manager = get(this, '_manager');
    if (manager) {
      manager.orphan();
      set(this, '_manager', null);
    }
  },

  destroy: function () {
    this._stylesheet = null;
  },

  dragEnter: function (evt) {
    this._dragEnters++;
    set(this, 'dragData', get(evt, 'originalEvent.dataTransfer'));
  },

  _invalidateDragData: function () {
    if (get(this, 'queued') > this._queued && get(this, 'dragData')) {
      set(this, 'dragData', null);
    }
    this._queued = get(this, 'queued');
  }.observes('queued'),

  dragLeave: function () {
    this._dragEnters--;
    if (this._dragEnters === 0) {
      set(this, 'dragData', null);
    }
  },

  isValid: function () {
    var data       = get(this, 'dragData'),
        extensions = get(this, 'extensions');

    // Validate
    if (extensions.length) {
      return slice.call(get(data, 'items') || []).every(function (item) {
        var fileType = $.trim(item.type).toLowerCase();
        return extensions.any(function (ext) {
          return (new RegExp(ext + '$')).test(fileType);
        });
      });
    }
    return true;
  }.property('dragData')

});

export default PlUploader;
