# JAUL

JAUL = Just Another Utilities Library

[![Build Status](https://img.shields.io/travis/igoramadas/jaul.svg?style=flat-square)](https://travis-ci.org/igoramadas/jaul)
[![Coverage Status](https://img.shields.io/coveralls/igoramadas/jaul.svg?style=flat-square)](https://coveralls.io/github/igoramadas/jaul?branch=master)

## What? Why?

Because to this date I still haven't found a good mix of small
utilities modules for my projects. And most of the time using
too many external smaller modules might be a problem for
security and complexity (node_modules bombs anyone?).

This project is the very first step taken to debundle the [Expresser](https://github.com/igoramadas/expresser)
framework into smaller, standalone libraries.

## What types of utilities?

They're separated on the following areas:

* Browser
* Data
* IO
* Network
* System

## Key principles

#### If it fails, it throws

You'll never need to guess what's going on behind the scenes.
For instance if you try to minify an invalid JSON, it will
throw an exception.

#### Exceptions with friendly messages

Exceptions thrown on methods might have a `friendlyMessage`
property appended to them with extra information.
