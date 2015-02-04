# Treed
A Powerful Tree Editing Component

[![Join the chat at https://gitter.im/jaredly/treed](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/jaredly/treed?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Treed wants to be for tree editing what ace is for text editing. Extensible, customizible, powerful, and just plain easy to use. Perhaps that's a little ambitious, but that's the idea.

[Play with a demo](http://jaredly.github.io/treed/)

[![screenshot](docs/screenshot.png)](http://jaredly.github.io/treed/)

## Features

### Keyboard navigation
I'm a vim user, so there are a lot of vim navigation commands that work out of the box, as well as more normal commands for everyone else.

<table id="bindings">
      <thead>
        <tr>
          <th>Action</th>
          <th>Bindings</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Navigation</td><td class="binding">arrow keys, hjkl</td></tr>
        <tr><td>Indent/Dedent</td><td class="binding">tab, shift tab</td></tr>
        <tr><td>Collapse/Expand</td><td class="binding">alt + left/right<br>alt + h/l<br>z (toggle)</td></tr>
        <tr><td>Undo/Redo</td><td class="binding">ctrl + z, ctrl + shift + z, u, R</td></tr>
        <tr><td>Move Node</td><td class="binding">ctrl + alt + arrow / hjkl</td></tr>
        <tr><td>Edit mode</td><td class="binding">return, f2, a, A, i, I</td></tr>
        <tr><td>Normal Mode</td><td class="binding">escape</td></tr>
        <tr><td>Toggle Done</td><td class="binding">ctrl + return</td></tr>
        <tr><td>New Node</td><td class="binding">o, O (before)<br>return (in insert mode)</td></tr>
        <tr><td>Cut/Copy/Paste</td><td class="binding">ctrl + x / delete, ctrl + c, ctrl + v</td></tr>
      </tbody>
      </table>

There are several more as well.

### Modularity
Treed is constructed using the MVC pattern such that it is simple to, for example, create an entirely different view for the tree.

You can also create your own "Node" class if you wanted to do more than just have a single text input. You could add buttons, more fields, whatever you want.

### Undo/Redo
It works. Unlimited undo.

## Drag and Drop
I'm still tinkering with the interaction on this. Should I let you drop as children of nodes that have no children?

## Still under development
I made this version in a weekend, so there are still some things to do :)

- multi-line select (cut/copy/paste multiple, not necessarily contiguous)
- api docs
- testing (js + browser)

## Future Awesomeness

I want to implement a view layer similar to each of the following sevices:

- workflowy
- trello
- a whiteboard
- ginko
- mindmap

And hook them all to the same model, allowing you to switch between contexts. And then hook it all up to a database (firebase or hood.ie or pouchdb or leveldb?).
I think it will be exactly what I've always wanted; we'll see.

# Build instructions

You will need:

- [nodejs](http://nodejs.org/)
- [browserify](http://browserify.org) `npm install -g browserify watchify`
- [less](http://lesscss.org) `npm install -g less`

```
npm install
make all
```


