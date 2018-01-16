'use babel'

/* global atom */

import {CompositeDisposable} from 'atom'
import url from 'url'
import config from './config.json'

export {activate, deactivate, config}

const ATOM_WDL_VIEWER_URI_PROTOCOL = 'atom-wdl-viewer:'
let AtomWDLViewerView
let disposables

function createAtomWDLViewerView (editorId) {
  if (!AtomWDLViewerView) {
    AtomWDLViewerView = require('./atom-wdl-viewer-view')
  }
  return new AtomWDLViewerView(editorId)
}

atom.deserializers.add({
  name: 'AtomWDLViewerView',
  deserialize: (state) => createAtomWDLViewerView(state.editorId)
})

function activate (state) {
  disposables = new CompositeDisposable()
  disposables.add(atom.commands.add('atom-workspace', {
    'atom-wdl-viewer:toggle': toggle
  }))

  disposables.add(atom.workspace.addOpener(AtomWDLViewerOpener))
}

function deactivate () {
  disposables.dispose()
}

function toggle () {
  if (isAtomWDLViewerView(atom.workspace.getActivePaneItem())) {
    atom.workspace.destroyActivePaneItem()
    return
  }

  const editor = atom.workspace.getActiveTextEditor()
  if (!editor) return

  const grammars = atom.config.get('atom-wdl-viewer.grammars') || []
  if (grammars.indexOf(editor.getGrammar().scopeName) === -1) return

  const uri = createAtomWDLViewerUri(editor)
  const viewer = atom.workspace.paneForURI(uri)

  if (!viewer) addViewerForUri(uri)
  else viewer.destroyItem(viewer.itemForURI(uri))
}

function addViewerForUri (uri) {
  const prevActivePane = atom.workspace.getActivePane()
  const options = { searchAllPanes: true }

  if (atom.config.get('atom-wdl-viewer.openInSplitPane')) {
    options.split = 'right'
  }

  atom.workspace.open(uri, options).then((view) => prevActivePane.activate())
}

function createAtomWDLViewerUri (editor) {
  return ATOM_WDL_VIEWER_URI_PROTOCOL + '//editor/' + editor.id
}

function AtomWDLViewerOpener (uri) {
  let parsedUri

  try {
    parsedUri = url.parse(uri)
  } catch (err) { return }

  if (parsedUri.protocol !== ATOM_WDL_VIEWER_URI_PROTOCOL) return

  const editorId = parsedUri.pathname.substring(1)
  return createAtomWDLViewerView(editorId)
}

function isAtomWDLViewerView (object) {
  if (!AtomWDLViewerView) {
    AtomWDLViewerView = require('./atom-wdl-viewer-view')
  }
  return object instanceof AtomWDLViewerView
}
