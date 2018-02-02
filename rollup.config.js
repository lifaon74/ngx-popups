export default {
  output: {
    name: 'ngx-popup',
    format: 'umd',
  },
  external: [
    '@angular/core',
    'ngx-dom-component',
  ],
  onwarn: (warning) => {
    const skip_codes = [
      'THIS_IS_UNDEFINED',
      'MISSING_GLOBAL_NAME'
    ];
    if(skip_codes.indexOf(warning.code) != -1) return;
    console.error(warning);
  }
};
