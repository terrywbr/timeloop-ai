export type MusicChannelKey =
  | 'lofiChill'
  | 'synthNight'
  | 'ambientForest'
  | 'droneZone'
  | 'deepSpace'
  | 'synphaera'
  | 'missionControl'
  | 'defconRadio'
  | 'beatBlender'
  | 'fluid'
  | 'cliqhop'
  | 'secretAgent'
  | 'lush'
  | 'digitalis'
  | 'suburbsOfGoa'
  | 'illstreet'
  | 'bootLiquor'
  | 'folkForward'
  | 'popTron'
  | 'indiePop'

/** HTTP audio streams for the left-panel station list. */
export const MUSIC_CHANNELS: { key: MusicChannelKey; streamUrl: string }[] = [
  {
    key: 'lofiChill',
    streamUrl: 'https://ice1.somafm.com/groovesalad-256-mp3',
  },
  {
    key: 'synthNight',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KGUFM.mp3',
  },
  {
    key: 'ambientForest',
    streamUrl: 'https://ice2.somafm.com/spacestation-128-mp3',
  },
  {
    key: 'droneZone',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
  },
  {
    key: 'deepSpace',
    streamUrl: 'https://ice1.somafm.com/deepspaceone-128-mp3',
  },
  {
    key: 'synphaera',
    streamUrl: 'https://ice1.somafm.com/synphaera-128-mp3',
  },
  {
    key: 'missionControl',
    streamUrl: 'https://ice1.somafm.com/missioncontrol-128-mp3',
  },
  {
    key: 'defconRadio',
    streamUrl: 'https://ice1.somafm.com/defcon-128-mp3',
  },
  {
    key: 'beatBlender',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
  },
  {
    key: 'fluid',
    streamUrl: 'https://ice1.somafm.com/fluid-128-mp3',
  },
  {
    key: 'cliqhop',
    streamUrl: 'https://ice1.somafm.com/cliqhop-128-mp3',
  },
  {
    key: 'secretAgent',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3',
  },
  {
    key: 'lush',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
  },
  {
    key: 'digitalis',
    streamUrl: 'https://ice1.somafm.com/digitalis-128-mp3',
  },
  {
    key: 'suburbsOfGoa',
    streamUrl: 'https://ice1.somafm.com/suburbsofgoa-128-mp3',
  },
  {
    key: 'illstreet',
    streamUrl: 'https://ice1.somafm.com/illstreet-128-mp3',
  },
  {
    key: 'bootLiquor',
    streamUrl: 'https://ice1.somafm.com/bootliquor-128-mp3',
  },
  {
    key: 'folkForward',
    streamUrl: 'https://ice1.somafm.com/folkfwd-128-mp3',
  },
  {
    key: 'popTron',
    streamUrl: 'https://ice1.somafm.com/poptron-128-mp3',
  },
  {
    key: 'indiePop',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3',
  },
]
