/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is DownThemAll URLManager module.
 *
 * The Initial Developer of the Original Code is Nils Maier
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Nils Maier <MaierMan@web.de>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const EXPORTED_SYMBOLS = [
	"UrlManager"
];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
const module = Cu.import;
const Exception = Components.Exception;

module("resource://dta/utils.jsm");

const DTA = {};
module("resource://dta/api.jsm", DTA);
const IOService = DTA.IOService;

const Limits = {};
module("resource://dta/serverlimits.jsm", Limits);

function compareFn(a, b) {
	const rv = b.preference - a.preference;
	return rv ? rv : (Math.floor(Math.random() * 3) - 1);
}

function UrlManager(urls) {
	this.initByArray(urls);
}
UrlManager.prototype = {
	initByArray: function um_initByArray(urls) {
		this._urls = [];
		this._idx = -1;
		for each (let u in urls) {
			if (u instanceof DTA.URL || (u.url && u.url instanceof Ci.nsIURI)) {
				this.add(u);
			}
			else if (u instanceof Ci.nsIURI) {
				this.add(new DTA.URL(u));
			}
			else {
				this.add(
					new DTA.URL(
						IOService.newURI(u.url,	u.charset, null),
						u.preference
					)
				);
			}
		}
		this._urls.sort(compareFn);
		this._usable = this._urls[0].usable;
		this.eHost = Limits.getEffectiveHost(this._urls[0].url); 

		this._hasFresh = this._urls.length != 0;		
	},
	add: function um_add(url) {
		if (!url instanceof DTA.URL) {
			throw new Exception(url + " is not an DTA.URL");
		}
		if (!this._urls.some(function(ref) ref.url.spec == url.url.spec)) {
			this._urls.push(url);
		}
	},
	getURL: function um_getURL(idx) {
		if (typeof(idx) != 'number') {
			this._idx++;
			if (this._idx >= this._urls.length) {
				this._idx = 0;
			}
			idx = this._idx;
		}
		return this._urls[idx];
	},
	get url() {
		return this._urls[0].url;
	},
	get usable() {
		return this._urls[0].usable;
	},
	get length() {
		return this._urls.length;
	},
	get all() {
		for each (let i in this._urls) {
			yield i;
		}
	},
	replace: function(url, newurl) {
		this._urls = this._urls.map(function(u) u.url.spec == url.url.spec ? newurl : u);
	},
	markBad: function um_markBad(url) {
		if (this._urls.length > 1) {
			this._urls = this._urls.filter(function(u) u != url);
		}
		else if (this._urls[0] == url) {
			return false;
		}
		return true;
	},
	toSource: function um_toSource() {
		let rv = [];
		for each (let url in this._urls) {
			rv.push(url.toSource());
		}
		return rv;
	},
	toString: function() {
		return this._urls.reduce(function(v, u) v + u.preference + " " + u.url + "\n");
	},
	// clone ;)
	toArray: function() this._urls.map(function(e) e)
};