# Changelog for JAUL

1.7.1
=====
* The data.replaceTags() now accept a fourth parameter to blank undefined values.
* Updated dependencies.

1.7.0
=====
* Fixed bugs with network's getSingleIPv4() and getSingleIPv6().
* Code refactoring.
* Updated dependencies.

1.6.2
=====
* The data.replaceTags() should now accept a direct replacement value as the second argument.

1.6.1
=====
* Improved support for ESM modules.
* Fixed regression bug on 1.6.0 (removed from NPM).

1.5.0
=====
* No more dependencies!
* Improved TypeScript definitions.
* Removed features that are available in Node: mkdirRecursive.

1.4.3
=====
* Updated dependencies.

1.4.2
=====
* Updated dependencies.

1.4.1
=====
* Updated dependencies.

1.4.0
=====
* Removed "lodash" and "moment" dependencies.

1.3.9
=====
* Updated dependencies.

1.3.8
=====
* Fixed regression bug on data.replaceTags() clearing ummatched tags.
* Updated dependencies.

1.3.7
=====
* Fixed issue where the data.replaceTags() would fail if substitution was null.

1.3.6
=====
* Updated dependencies.

1.3.5
=====
* Updated dependencies.

1.3.4
=====
* Updated dependencies.

1.3.3
=====
* Updated dependencies.

1.3.2
=====
* The data.replaceTags() now accepts an optional tag prefix (removed before replacing).

1.3.1
=====
* TypeScript types are now exported with the library.

1.2.3
=====
* Updated dependencies.

1.2.2
=====
* New data.replaceTags() to replace tags on a string with values from an object.
* Now network.getClientIP() also checks for the Forwarded header.

1.2.0
=====
* New data.stripHtml() to remove HTML tags from text.
* Updated dependencies.

1.1.2
=====
* Updated dependencies.

1.1.1
=====
* Network getClientIP() checks for additional headers.

1.1.0
=====
* General refactoring.
* Updated dependencies.

1.0.5
=====
* Updated dependencies.

1.0.4
=====
* IO getFilePath() will try local / absolute path last.

1.0.3
=====
* Removed .git from package.

1.0.2
=====
* Updated dependencies.

1.0.1
=====
* Updated dependencies.

1.0.0
=====
* Initial release.
