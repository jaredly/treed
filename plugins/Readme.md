# Plugin spec

## types
- shortcut, a key

## node
type EditState = 'state' | 'end' | 'default' | number | 'change'

type EditorProps = {
  ref: 'text',
  value: string,
  store: Store,
  editState: EditState,
  goDown: () => void,
  goUp: () => void,
  joinUp: () => void,
  createAfter: () => void,
  removeEmpty: () => void,
  onChange: ??,
  onBlur: () => void,
}

type RendererProps = {
}

{
  bodies: {
    [node type]: {
      Component?: React component,
      editor?: (props: {}) => React element,
      // onClick starts the editing if we're not editing
      renderer?: [this context](props, onClick) {
      }
    },
  }
}

