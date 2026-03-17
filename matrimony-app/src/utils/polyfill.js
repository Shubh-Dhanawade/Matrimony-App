import React from 'react';
import PropTypes from 'prop-types';

// Polyfill for older libraries that still use React.PropTypes (e.g. react-native-deck-swiper)
// This must be loaded before any component that uses these libraries
if (!React.PropTypes) {
    console.log('[POLYFILL] Injecting React.PropTypes');
    React.PropTypes = PropTypes;
}
