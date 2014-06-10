
/** Node format
{
  id: #,
  contents: '',
  parent: id,
  children: [id, ...],
  created: Date,
  modified: Date,
  type: 'basic',
  meta: {},
  collapsed: false
} 
*/

module.exports = {
  base: {
  },
  task: {
    completed: Date,
    due: Date
  },
  quote: {
    speaker: 'str' | 'id',
    citation: 'str'
  },
  scripture: {
    reference: 'str'
  },
  appointment: {
    time: Date,
    duration: Number,
    location: 'str' | 'id',
    attendees: ['str' | 'id']
  },
  alarm: {
    time: Date,
    repeat: Object
  },
  goal: {
    target: 'id',
    repeat: Object
  },
  timepunch: {
    target: 'id',
    time: Date,
    duration: Number
  }
}

