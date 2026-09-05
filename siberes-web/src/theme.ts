import {
  createTheme,
  type MantineColorsTuple,
} from '@mantine/core';

const bpsBlue: MantineColorsTuple = [
  '#e8f6fc',
  '#d4edf8',
  '#a8dcf1',
  '#78c9e9',
  '#4db9e2',
  '#28acdc',
  '#009ed5',
  '#008abd',
  '#007aa8',
  '#006b94',
];

const bpsOrange: MantineColorsTuple = [
  '#fff4e6',
  '#ffe8cc',
  '#ffd09a',
  '#ffb664',
  '#fca03c',
  '#f7941d',
  '#e67f00',
  '#cc6f00',
  '#b56000',
  '#9d5100',
];

const bpsGreen: MantineColorsTuple = [
  '#f1f8e9',
  '#dcedc8',
  '#c5e1a5',
  '#aed581',
  '#9ccc65',
  '#8bc34a',
  '#7cb342',
  '#689f38',
  '#558b2f',
  '#33691e',
];

export const theme = createTheme({
  primaryColor: 'bpsBlue',
  primaryShade: 6,

  colors: {
    bpsBlue,
    bpsOrange,
    bpsGreen,
  },

  defaultRadius: 'md',

  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },

    Paper: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});
