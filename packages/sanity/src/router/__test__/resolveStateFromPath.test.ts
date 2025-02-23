import {_resolveStateFromPath} from '../_resolveStateFromPath'
import {type RouterNode} from '../types'

const node: RouterNode = {
  route: {
    raw: '/foo/:bar',
    segments: [
      {type: 'dir', name: 'foo'},
      {type: 'param', name: 'bar'},
    ],
  },
  children: [
    {
      route: {
        raw: '/dynamic/:foo',
        segments: [
          {type: 'dir', name: 'dynamic'},
          {type: 'param', name: 'foo'},
        ],
      },
      children(state: any) {
        if (state.foo === 'foo') {
          return [
            {
              route: {
                raw: '/:whenfoo',
                segments: [{type: 'param', name: 'whenfoo'}],
              },
              transform: {},
              children: [],
            },
          ]
        }
        return [
          {
            route: {
              raw: '/:notfoo',
              segments: [{type: 'param', name: 'notfoo'}],
            },
            transform: {},
            children: [],
          },
        ]
      },
    },
    {
      route: {
        raw: '/nix/:animal',
        segments: [
          {type: 'dir', name: 'nix'},
          {type: 'param', name: 'animal'},
        ],
      },
      children: [],
    },
    {
      route: {
        raw: '/qux/:animal',
        segments: [
          {type: 'dir', name: 'qux'},
          {type: 'param', name: 'animal'},
        ],
      },
      transform: {
        animal: {
          toState: (value) => ({name: value.toUpperCase()}),
          toPath: (animal) => (animal.name as string).toLowerCase(),
        },
      },
      children: [],
    },
  ],
}

const examples: any[] = [
  ['/foo/bar', {bar: 'bar'}],
  ['foo/bar', {bar: 'bar'}],
  ['foo/bar/baz', null],
  [
    '/foo/bar/qux/cat',
    {
      animal: {name: 'CAT'},
      bar: 'bar',
    },
  ],
  [
    '/foo/bar/nix/cat',
    {
      animal: 'cat',
      bar: 'bar',
    },
  ],
  [
    '/foo/bar/nix/cat',
    {
      animal: 'cat',
      bar: 'bar',
    },
  ],
  ['/nope/bar', null],
  [
    '/foo/bar/dynamic/foo/thisisfoo',
    {
      bar: 'bar',
      foo: 'foo',
      whenfoo: 'thisisfoo',
    },
  ],
  ['/foo', null],
].filter(Boolean)

examples.forEach(([path, state]) => {
  test(`path ${path} => ${JSON.stringify(state)}`, () => {
    expect(_resolveStateFromPath(node, path)).toEqual(state)
  })
})

// IDEA! Can/should not map from a global param space to state because conflicts
// assert.deepEqual(resolveStateFromPath(node, '/foo/bar;flabla=flarb/nix/cat;family=mammal'), {
//
// })
