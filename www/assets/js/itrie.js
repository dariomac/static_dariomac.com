/*
 * The MIT License
 *
 *  Copyright (c) 2010 Mike de Boer
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

 /**
  * Trie is a kind of digital search tree. (See [Knuth1972] for more details
  * on digital search trees.)
  * [Fredkin1960] introduced the trie terminology, which is abbreviated from "Retrieval".
  * [Knuth1972] Knuth, D. E. The Art of Computer Programming Vol. 3, Sorting and Searching. Addison-Wesley. 1972.
  * [Fredkin1960] Fredkin, E. Trie Memory. Communication of the ACM. Vol. 3:9 (Sep 1960). pp. 490-499.
  * <a href="http://linux.thai.net/~thep/datrie/datrie.html">source</a>
  * @see <a href="http://en.wikipedia.org/wiki/Trie">Wikipedia article</a>
  *
  * The trie implementation of Dennis Byrne served as a starting point and inspiration:
  * @link http://notdennisbyrne.blogspot.com/2008/12/javascript-trie-implementation.html
  *
  * @param {String} stem    One character long representation of the trie node instance
  * @default ''
  * @param {Array}  meta    Metadata associated with a word is stored here
  * @default {}
  * @param {Number} sorting Sort method. May be {@link SORT_ASC} or {@link SORT_DESC}.
  * @default SORT_DESC
  * @property {Number} SORT_ASC sort the trie in ascending lexical order
  * @property {Number} SORT_DESC sort the trie in descending lexical order
  * @property {Number} SORT_NONE  sort the trie in no particular order
  * @author Mike de Boer <info AT mikedeboer DOT nl>
  * @license MIT
  * @constructor
  */
  var Trie = (function() {

    /** @ignore */
    function Trie(stem, sorting) {
      this.stem        = stem || "";
      this.nstem       = this.stem.toLocaleUpperCase().charCodeAt(0);
      this.sorting     = sorting || Trie.SORT_DESC;
      this.wordCount   = 0;
      this.prefixCount = 0;
      this.children    = [];
      this.meta        = [];
    }

    Trie.SORT_ASC  = 0x0001;
    Trie.SORT_DESC = 0x0002;
    Trie.SORT_NONE = 0x0004;

    var STATIC_PROPS = ["stem", "nstem", "sorting", "wordCount", "prefixCount", "meta"];

    Trie.prototype = {
    /**
     * Add a word to the existing dictionary. If a trie node doesn't exist
     * yet, it is created with that character as its stem.
     * Since an add is already an expensive action, compared to adding nodes to
     * native Javascript containers like Array or Object, inserting a trie
     * node in lexical order is relatively cheap.
     * Please refer to the test suite to compare performance in your browser(s).
     *
     * @param {String} word Remainder of the word that is added to the root trie
     * @param {Object} meta Metadata associated with a word
     * @type  {void}
     */
     add: function(word, meta) {
      if (word) {
        var t,
        s = this.sorting,
        i = 0,
        k = word.charAt(0),
        c = this.children,
        l = c.length;
        meta = meta || {};
        if (!meta.word)
          meta.word = word;
            // check if a child with stem 'k' already exists:
            for (; i < l; ++i) {
              if (c[i].stem.toLocaleUpperCase() === k.toLocaleUpperCase()) {
                t = c[i];
                break;
              }
            }
            if (!t) {
              ++this.prefixCount;
              t = new Trie(k, s);
              if (!s || !c.length || s & Trie.SORT_NONE) {
                c.push(t);
              }
              else if (s & Trie.SORT_DESC) {
                i = l;
                do {
                  if (--i < 0) {
                    c.unshift(t);
                    break;
                  }
                } while (c[i].stem.toLocaleUpperCase() > k.toLocaleUpperCase())
                if (i >= 0)
                  c.splice(i + 1, 0, t);
              }
              else {
                i = 0, --l;
                do {
                  if (++i > l) {
                    c.unshift(t);
                    break;
                  }
                } while (c[i].stem.toLocaleUpperCase() > k.toLocaleUpperCase())
                if (i <= l)
                  c.splice(i, 0, t);
              }
            }
            t.add(word.substring(1), meta);
          }
          else {
            this.meta.push(meta);
            ++this.wordCount;
          }
        },

        /**
         * Update a word in the dictionary. This update implementation is
         * implemented like a file rename action as on a filesystem: add a node
         * with the new name and remove the outdated, 'old' version.
         *
         * @param {String} sOld the old word to be replaced by the word provided
         *                      by 'sNew'
         * @param {String} sNew the new word to be added to the dictionary
         * @param {Object} meta Metadata associated with a word
         * @type  {void}
         */
         update: function(sOld, sNew, meta) {
          this.remove(sOld);
          this.add(sNew, meta);
        },

        /**
         * Remove a word from the dictionary. This function uses the
         * walker, which is a generic implementation of a tree walker.
         *
         * @param {String} word the word to remove
         * @type  {void}
         */
         remove: function(word) {
          walker(word, this, function(trie, idx) {
            trie.children.remove(idx);
          });
        },

        /**
         * Find a trie node that is paired with a word or prefix 's'. Like the
         * {@link remove} function, this function also uses the walker.
         *
         * @param {String}   prefix the word or prefix to search for in the dictionary
         * @type  {Trie}
         */
         find: function(prefix) {
          return walker(prefix, this, function(trie, idx) {
            return trie.children[idx];
          });
        },

        /**
         * @alias {find}
         *
         * @param {String} prefix the word or prefix to search for in the dictionary
         * @type  {Trie}
         */
         findPrefix: function(prefix) {
            // AFAIK, this is just an alias of find, because that returns a trie rootnode.
            // From that rootnode, it's easy to create a list of disambiguations.
            return this.find(prefix);
          },

        /**
         * Retrieve a direct child node of this dictionary with 'prefix'.
         *
         * @param {String} prefix s the word or prefix to search for in the
         *                          children of this dictionary
         * @type  {Trie}
         */
         getChild: function(prefix) {
          var i = 0,
          c = this.children,
          l = c.length;
          for (; i < l; ++i) {
            if (c[i].stem.toLocaleUpperCase() === prefix.toLocaleUpperCase())
              return c[i];
          }

          return null;
        },

        /**
         * A version of {@link getChild} with a Boolean return type.
         *
         * @param {String} prefix s the word or prefix to search for in the
         *                          children of this dictionary
         * @type  {Boolean}
         */
         hasChild: function(prefix) {
          return this.getChild(prefix) !== null;
        },

        /**
         * Resort this dictionary in lexical order, either in an ascending or
         * descending direction.
         * Since it uses the native {@link Array#sort} method, sorting speed can
         * be considered linear O(n) to the size of the trie, i.e. the word count.
         * Please refer to the test suite to compare performance in your browser(s).
         *
         * @param {Number} direction sorting direction. Possible values:
         *                 {@link Trie#SORT_ASC}
         *                 {@link Trie#SORT_DESC}
         * @type  {void}
         */
         sort: function(direction) {
          if (typeof direction == "undefined")
            direction = Trie.SORT_DESC;
          if (!this.prefixCount || this.sorting === direction) return;
          this.sorting = direction;
          if (direction & Trie.SORT_NONE) return;
          var c = this.children,
          i = c.length - 1,
          m = direction & Trie.SORT_ASC ? sortAsc : sortDesc;
          c.sort(m);
          for (; i >= 0; --i)
            c[i].sort(direction);
        },

        /**
         * Retrieve the Array of words that originate from this trie.
         * The main use-case for this function is for implementations of the
         * type-ahead user experience pattern, but can be used to other ends as
         * well, of course.
         * The performance of this function still needs to be profiled against
         * alternatives, like pre-caching the words Array per Trie when it's
         * instantiated.
         *
         * @type  {Array}
         */
         getWords: function() {
          var words = [],
          c     = this.children,
          i     = 0,
          l     = c.length;
          for (; i < l; ++i) {
            if (c[i].wordCount) {
              words = words.concat(c[i].meta.map(function(meta) {
                return meta.word;
              }));
            }
            words = words.concat(c[i].getWords());
          }
          return words;
        },

        /**
         * Retrieve the prefix count of the applied argument
         *
         * @param {String} word the prefix or word-completing stem
         * @type  {Number}
         */
         getPrefixCount: function(word){
          return walker(word, this, function(trie, idx) {
            return trie.children[idx].prefixCount;
          }) || 0;
        },

        /**
         * Retrieve the word count of the applied argument
         *
         * @param {String} word the prefix or word-completing stem
         * @type  {Number}
         */
         getWordCount: function(word){
          return walker(word, this, function(trie, idx) {
            return trie.children[idx].wordCount;
          }) || 0;
        },

        /**
         * Overrides Object.prototype.toString to deliver a more context sensitive
         * String representation of a Trie.
         *
         * @type {String}
         */
         toString: function() {
          return "[Trie] '" + this.stem + "': {\n"
          + "    stem: " + this.stem + ",\n"
          + "    prefixCount: " + this.prefixCount + ",\n"
          + "    wordCount: " + this.wordCount + ",\n"
          + "    metadata: " + JSON.stringify(this.meta) + ",\n"
          + "    children: [Array]{" + this.children.length + "}\n"
          + "}";
        },

        /**
         * Load this Trie instance with properties from `json`; a serialized old(er)
         * version.
         *
         * @param {Object} json A serialized version of a Trie
         * @type  {void}
         */
         fromJSON: function(json) {
          STATIC_PROPS.forEach(function(prop) {
            this[prop] = json[prop];
          }.bind(this));
          this.children = json.children.map(function(data) {
            var child = new Trie();
            child.fromJSON(data);
            return child;
          });
        },

        /**
         * Serialize this Trie instance to a JSON blob that may be stringified
         * and used at convenience.
         *
         * @type {Object}
         */
         toJSON: function() {
          var json = {
            children: this.children.map(function(child) {
              return child.toJSON();
            })
          };
          STATIC_PROPS.forEach(function(prop) {
            json[prop] = this[prop];
          }.bind(this));
          return json;
        }
      };

    /**
     * NOT named after Johnny, but merely after the verb 'to walk'.
     * This function walks along a Trie top-down until it finds the node which
     * fully represents the term/ prefix/ word that was searched for.
     * It passes the parent node of the found Trie and its index to a callback
     * function. It passes the parent node, because otherwise Trie mutation would
     * become increasingly more difficult.
     *
     * An earlier implementation of this function used a naive recursive algorithm,
     * but my friend - @ejpbruel - has shown me that you can simply rewrite any form
     * of tail-recursion to an inner loop.
     *
     * @param {String}   word   the word or prefix to search for
     * @param {Trie}     trie   the root trie node to walk through
     * @param {Function} method callback function to which the results of the
     *                          walker are passed
     * @type  {mixed}
     * @memberOf Trie
     */
     function walker(word, trie, method) {
      if (!word || !trie || !method) return null;
      var ch, c, l, i, prev;

      while (word.length > 0) {
        ch = word.charAt(0),
        c  = trie.children,
        l  = c.length,
        i  = 0;
        for (; i < l; ++i) {
          if (ch.toLocaleUpperCase() === c[i].stem.toLocaleUpperCase())
            break;
        }
        if (i == l)
                return null; // not found
              word = word.substring(1),
              prev = trie,
              trie = c[i];
            }
            return method(prev, i);
          }

    /**
     * Sorting helper function that can be passed to Array.sort().
     * The result of this helper will be that all nodes will be sorted in
     * ascending lexical order.
     *
     * @param {Trie} a first element for comparison
     * @param {Trie} b second element for comparison
     * @type  {Number}
     * @memberOf Trie
     */
     function sortAsc(a, b) {
      var s1 = a.nstem,
      s2 = b.nstem;
      return (s1 < s2) ? 1 : (s1 > s2) ? -1 : 0;
    }

    /**
     * Sorting helper function that can be passed to Array.sort().
     * The result of this helper will be that all nodes will be sorted in
     * descending lexical order.
     *
     * @param {Trie} a first element for comparison
     * @param {Trie} b second element for comparison
     * @type  {Number}
     * @memberOf Trie
     */
     function sortDesc(a, b) {
      var s1 = a.nstem,
      s2 = b.nstem;
      return (s1 > s2) ? 1 : (s1 < s2) ? -1 : 0;
    }

    return Trie;
  })();

  //https://javascriptobfuscator.com/Javascript-Obfuscator.aspx
  var _0x16bc=["\x20\x2F\x5C\x28\x29\x22\x27\x3A\x2C\x2E\x3B\x3C\x3E\x7E\x21\x40\x23\x24\x25\x5E\x26\x2A\x7C\x2B\x3D\x5B\x5D\x7B\x7D\x60\x7E\x3F\x22","","\x20","\x6C\x65\x6E\x67\x74\x68","\x3E","\x3C","\x69\x6E\x64\x65\x78\x4F\x66","\x66\x69\x6E\x64","\x70\x72\x65\x66\x69\x78\x43\x6F\x75\x6E\x74","\x77\x6F\x72\x64\x43\x6F\x75\x6E\x74","\x6D\x65\x74\x61","\x63\x61\x6C\x6C","\x70\x75\x73\x68","\x69\x73\x5F\x61\x5F\x77\x6F\x72\x64","\x70\x6F\x74\x65\x6E\x74\x69\x61\x6C","\x73\x70\x6C\x69\x74\x74\x65\x72","\x70\x6F\x73\x69\x74\x69\x6F\x6E","\x70\x6F\x70","\x73\x6C\x69\x63\x65","\x74\x72\x69\x6D","\x7C","\x6C\x6F\x67"];function zulupadize(_0x86c5x2,_0x86c5x3,_0x86c5x4){var _0x86c5x5=_0x16bc[0];var _0x86c5x6=_0x16bc[1];var _0x86c5x7=_0x16bc[1];var _0x86c5x8=[];var _0x86c5x9=false;var _0x86c5xa,_0x86c5xb,_0x86c5xc;_0x86c5x3+= _0x16bc[2];for(var _0x86c5xd=0,_0x86c5xe=_0x86c5x3[_0x16bc[3]];_0x86c5xd< _0x86c5xe;_0x86c5xd++){_0x86c5xb= _0x86c5x3[_0x86c5xd];if(_0x86c5xb=== _0x16bc[4]){_0x86c5x9= false;_0x86c5x6+= _0x86c5xb}else {if(_0x86c5xb=== _0x16bc[5]){_0x86c5x9= true};if(!_0x86c5x9|| _0x86c5xb=== _0x16bc[5]&& _0x86c5x7[_0x16bc[3]]!=  -1){if(_0x86c5x5[_0x16bc[6]](_0x86c5xb)>  -1){_0x86c5xa= _0x86c5x2[_0x16bc[7]](_0x86c5x7),_0x86c5xc= false;if(_0x86c5xa&& _0x86c5xa[_0x16bc[8]]=== 0&& _0x86c5xa[_0x16bc[9]]=== 1){_0x86c5x6+= _0x86c5x4[_0x16bc[11]](this,_0x86c5x7,_0x86c5xa[_0x16bc[10]])+ _0x86c5xb;_0x86c5x8[_0x16bc[3]]= 0;_0x86c5x7= _0x16bc[1]}else {if(_0x86c5xa&& _0x86c5xa[_0x16bc[8]]> 0){_0x86c5x8[_0x16bc[12]]({"\x70\x6F\x74\x65\x6E\x74\x69\x61\x6C":_0x86c5x7,"\x70\x6F\x73\x69\x74\x69\x6F\x6E":_0x86c5xd,"\x73\x70\x6C\x69\x74\x74\x65\x72":_0x86c5xb,"\x6D\x65\x74\x61":_0x86c5xa[_0x16bc[10]],"\x69\x73\x5F\x61\x5F\x77\x6F\x72\x64":_0x86c5xa[_0x16bc[9]]=== 1});_0x86c5x7+= _0x86c5xb}else {_0x86c5xc= false;for(var _0x86c5xf=_0x86c5x8[_0x16bc[3]]- 1;_0x86c5xf>= 0;_0x86c5xf--){var _0x86c5x10=_0x86c5x8[_0x86c5xf];_0x86c5xc= true;if(_0x86c5x10[_0x16bc[13]]){_0x86c5x6+= _0x86c5x4[_0x16bc[11]](this,_0x86c5x10[_0x16bc[14]],_0x86c5x10[_0x16bc[10]])+ _0x86c5x10[_0x16bc[15]];_0x86c5xd= _0x86c5x10[_0x16bc[16]];_0x86c5x8[_0x16bc[3]]= 0;_0x86c5x7= _0x16bc[1];break}};if(_0x86c5x8[_0x16bc[3]]> 0){var _0x86c5x11=_0x86c5x8[_0x16bc[17]]();_0x86c5x6+= _0x86c5x11[_0x16bc[14]]+ _0x86c5x11[_0x16bc[15]];_0x86c5xd= _0x86c5x11[_0x16bc[16]];_0x86c5x8[_0x16bc[3]]= 0;_0x86c5x7= _0x16bc[1]};if(!_0x86c5xc){_0x86c5x6+= _0x86c5x7+ _0x86c5xb;_0x86c5x7= _0x16bc[1]}}};if(_0x86c5x6[_0x86c5x6[_0x16bc[3]]- 1]=== _0x86c5x6[_0x86c5x6[_0x16bc[3]]- 2]&& _0x86c5x6[_0x86c5x6[_0x16bc[3]]- 1]=== _0x16bc[2]){_0x86c5x6= _0x86c5x6[_0x16bc[18]](0,-1)}}else {_0x86c5x7+= _0x86c5xb}}else {for(var _0x86c5xf=_0x86c5x8[_0x16bc[3]]- 1;_0x86c5xf>= 0;_0x86c5xf--){var _0x86c5x10=_0x86c5x8[_0x86c5xf];_0x86c5xc= true;if(_0x86c5x10[_0x16bc[13]]){_0x86c5x6+= _0x86c5x4[_0x16bc[11]](this,_0x86c5x10[_0x16bc[14]],_0x86c5x10[_0x16bc[10]])+ _0x86c5x10[_0x16bc[15]];_0x86c5x8[_0x16bc[3]]= 0;_0x86c5x7= _0x16bc[1];break}};_0x86c5x6+= _0x86c5xb}}};if(_0x86c5x8[_0x16bc[3]]> 0){var _0x86c5x11=_0x86c5x8[_0x16bc[17]]();_0x86c5x6+= _0x86c5x4[_0x16bc[11]](this,_0x86c5x11[_0x16bc[14]],_0x86c5x11[_0x16bc[10]])}else {_0x86c5x6+= _0x86c5x7};_0x86c5x6= _0x86c5x6[_0x16bc[19]]();console[_0x16bc[21]](_0x16bc[20]+ _0x86c5x6+ _0x16bc[20]);return _0x86c5x6}
