define(function() {
    'use strict';

    require("./date-editor.css");

    var html_temp = require("./date-editor.html");
    var DatePicker = require("../date-picker/date-picker.js");
    var ChartBase = require('portfolio-components-chart-base');
    var T = ChartBase.T;

    var DateEditor = DatePicker.extend({

        defaultOption: function() {
            return $.extend(true, DatePicker.prototype.defaultOption(), {
                className: "ma_date_editor",

                template: html_temp,
                type: "main",
                labelPlaceHolder: "Search All Portfolio Dates",

                main: {
                    name: "Portfolio Holdings Dates",
                    bt_back: false,
                    bt_done: false,
                    value: "Edit Date",
                    list: [{
                        "label": "Edit Date",
                        "value": "edit_date"
                    }, {
                        "label": "Create New",
                        "value": "create_new"
                    }, {
                        "label": "Create From Existing",
                        "value": "create_from_existing"
                    }, {
                        "label": "Delete Existing",
                        "value": "delete_existing"
                    }, {
                        "label": "Open",
                        "value": "open"
                    }]
                },


                edit_date: {
                    name: "Edit Date",
                    bt_back: true,
                    bt_done: true,
                    type: "edit",
                    date: {
                        "title": "Portfolio Holdings Date",
                        "label": "",
                        "value": "",
                        "placeholder": "",
                        "scroll": {}
                    }
                },

                create_new: {
                    name: "Create New",
                    bt_back: true,
                    bt_done: true,
                    type: "add",
                    date: {
                        "title": "Select Date",
                        "label": "",
                        "value": "",
                        "placeholder": "1/19/2016",
                        "scroll": {}
                    }
                },

                create_from_existing: {
                    name: "Create From Existing",
                    bt_back: true,
                    bt_done: false,
                    type: "copy",
                    value: "",
                    list: [],
                    scroll: {}
                },

                delete_existing: {
                    name: "Delete Existing",
                    bt_back: true,
                    bt_done: false,
                    type: "delete",
                    value: "",
                    list: [],
                    scroll: {}
                },

                open: {
                    name: "Open",
                    bt_back: true,
                    bt_done: false,
                    type: "open",
                    value: "",
                    list: [],
                    scroll: {}
                },

                subs_create_from_existing: {
                    name: "Create From Existing",
                    preId: "create_from_existing",
                    bt_back: true,
                    bt_done: true,
                    holdings_date: {
                        title: "Holdings Date",
                        label: "",
                        value: "",
                        placeholder: "1/19/2016",
                        scroll: {}
                    },
                    retain: {
                        title: "Retain From",
                        label: "",
                        value: "Shares",
                        placeholder: "",
                        list: ["Shares", "Weight"],
                        scroll: {}
                    }
                }

            });
        },

        initContainer: function() {
            var o = this.option;

            this.container = $(o.template).addClass(o.className);

            var self = this;

            this.btBack = this.find(".ma_date_editor_back").hide();
            this.btBack.unbind().bind("click", function(e) {
                self.btBackHandler(e);
            });

            this.containerTitle = this.find(".ma_date_editor_title");

            this.btDone = this.find(".ma_date_editor_done").html(o.labelDone).hide();
            this.btDone.unbind().bind("click", function(e) {
                self.btDoneHandler(e);
            });

            this.containerHead = this.find(".ma_date_editor_head");
            this.containerList = this.find(".ma_date_editor_list");
            if (o.style) {
                this.containerList.css(o.style);
                this.containerHead.width(this.containerList.width());
            }
            this.containerSearch = this.find(".ma_popup_search");
            this.containerSearch.visible = false;

            this.containerInput = this.find(".search-input");
            this.containerDelete = this.find(".search-delete").hide();

            this.containerDelete.bind("click", function() {
                self.containerInput.val("").focus();
                self.onSearchHandler("");
            });

            this.containerInput.bind("keyup change", function() {
                self.onSearchHandler($(this).val());
            });

            this.viewCache = {};
            this.currentView = null;
            this.previousView = null;

        },

        //====================================================================

        show_main: function(view) {

            view.scrollPane.show();

            //use cache content
            if (view.hasContent) {
                this.sizeHandler(view);
                return this;
            }

            view.scrollPane.empty();

            var self = this;

            var draw_view_list = function(view, self) {
                var list = view.list;
                if (!T.islist(list)) {
                    view.scrollPane.html(self.option.labelNoResults);
                    return;
                }
                for (var i = 0, l = list.length; i < l; i++) {
                    var item = list[i];
                    var elem = $("<div/>").addClass("item").attr({
                        value: item.value
                    }).data("data", item).html(item.label);
                    if (self.isViewId(item.value)) {
                        self.setElemNext(elem);
                    } else if (view.value === item.value) {
                        self.setElemSelected(elem);
                    }
                    view.scrollPane.append(elem);
                }
                view.hasContent = true;
            };

            draw_view_list(view, this);
            this.sizeHandler(view);
            view.container.find(".item").unbind().bind("click", function(e) {
                var elem = $(this);
                var item = elem.data("data");

                if (self.isViewId(item.value)) {
                    self.showView({
                        id: item.value,
                        onShow: self.onViewShow
                    });
                    return;
                }

                view.item = item;
                view.value = item.value;

                view.container.find(".item").removeClass("selected");

                self.setElemSelected(elem);

                //most recent
                var noChange = view.value === view.originalValue;
                self.finish_handler(item, noChange);

            });

            return this;
        },

        //All view editor
        //===========================================
        show_edit_date: function(view) {
            view.scrollPane.show();
            view.scrollPane.empty();

            this.drawInput(view, view.date);

            this.sizeHandler(view);

            return this;
        },

        show_edit_date_handler: function() {
            //check if date is valid
            var date = this.currentView.date;

            if (!date.value) {
                date.input.focus();
                return this;
            }

            this.finish_handler({
                label: date.label,
                value: date.value,
                type: this.currentView.type
            });
            return this;
        },
        show_create_new: function(view) {
            view.scrollPane.show();


            view.scrollPane.empty();

            this.drawInput(view, view.date);

            this.sizeHandler(view);

            return this;
        },

        show_create_new_handler: function(e) {
            //check if date is valid
            var date = this.currentView.date;

            if (!date.value) {
                date.input.focus();
                return this;
            }

            this.finish_handler({
                label: date.label,
                value: date.value,
                type: this.currentView.type
            });
            return this;
        },

        //============================================
        show_create_from_existing: function(view) {
            view.scrollPane.show();
            this.containerDelete.hide();
            if (this.containerSearch.hasClass("hidden")) {
                this.containerSearch.removeClass("hidden");
            } else {
                this.containerSearch.addClass("hidden");
            }

            view.scrollPane.empty();
            this.drawSearchList(view);
            this.setPlaceHolder(this.containerInput, this.option.labelPlaceHolder);
            this.sizeHandler(view);
            return this;

        },

        show_subs_create_from_existing_handler: function() {
            if (!this.currentView || !this.currentView.parentView) {
                return this;
            }
            var date = this.currentView.holdings_date;
            var retain = this.currentView.retain;
            var parentView = this.currentView.parentView;
            if (!parentView) {
                return this;
            }
            if (!date.value) {
                date.input.focus();
                return this;
            }

            this.finish_handler({
                label: date.label,
                value: date.value,
                retain: retain.value,
                type: parentView.type,
                originalValue: parentView.value

            });
            return this;
        },

        //=================================================
        show_delete_existing: function(view) {
            view.scrollPane.show();
            this.containerDelete.hide();
            //TODO
            if (this.containerSearch.hasClass("hidden")) {
                this.containerSearch.removeClass("hidden");
            } else {
                this.containerSearch.addClass("hidden");
            }

            view.scrollPane.empty();
            this.drawSearchList(view);
            this.setPlaceHolder(this.containerInput, this.option.labelPlaceHolder);
            this.sizeHandler(view);
            return this;
        },

        //==================================================
        show_open: function(view) {
            view.scrollPane.show();
            this.containerDelete.hide();
            //TODO
            if (this.containerSearch.hasClass("hidden")) {
                this.containerSearch.removeClass("hidden");
            } else {
                this.containerSearch.addClass("hidden");
            }

            view.scrollPane.empty();
            this.drawSearchList(view);
            this.setPlaceHolder(this.containerInput, this.option.labelPlaceHolder);
            this.sizeHandler(view);
            return this;
        },

        //====================================================

        show_subs_create_from_existing: function(view) {
            view.scrollPane.show();
            if (!this.containerSearch.hasClass("hidden")) {
                this.containerSearch.addClass("hidden");
            }
            view.scrollPane.empty();

            this.drawInput(view, view.holdings_date);

            this.drawDropDown(view, view.retain);

            //add space
            var space = $("<div/>").addClass(this.option.className + "_custom_space");
            view.scrollPane.append(space);

            this.sizeHandler(view);
        },

        //====================================================
        //search UI

        drawSearchList: function(view, datelist) {

            view.scrollPane.empty();
            var list = datelist || view.list;

            var subsViewId = "subs_" + view.id;
            var draw_view_list = function(view, self) {

                for (var i = 0, l = list.length; i < l; i++) {
                    var item = list[i];
                    item.type = view.type;
                    var elem = $("<div/>").addClass("item").attr({
                        value: item.value
                    }).data("data", item).html(item.label);
                    setElem(item, elem, self);
                    view.scrollPane.append(elem);
                }
                view.scrollPane.append("<div class='no_results hidden'>" + self.option.labelNoResults + "<div/>");
            };
            var setElem = function(item, elem, self) {
                if (view.value === item.value) {
                    self.setElemSelected(elem);
                }
                if (self.option[subsViewId]) {
                    if (view.value === item.value) {
                        elem.append("<span class='ic-ctxt-checkmark-sm'></span>");
                    }
                    self.setElemNext(elem);
                }
            };

            draw_view_list(view, this);
            var self = this;
            this.sizeHandler(view);
            view.scrollPane.find(".item").unbind().bind("click", function(e) {
                var elem = $(this);
                var item = elem.data("data");
                if (self.option[subsViewId]) {
                    view.item = item;
                    view.value = item.value;
                    self.showView({
                        id: subsViewId,
                        onShow: self.onViewShow
                    });
                    return;
                }

                view.item = item;
                view.value = item.value;

                view.container.find(".item").removeClass("selected");

                self.setElemSelected(elem);
                var noChange = view.value === view.originalValue;
                self.finish_handler(item, noChange);

            });

        },


        onSearchHandler: function(keywords) {

            keywords = (keywords + "").toLowerCase();
            if (keywords) {
                this.containerDelete.show();
            } else {
                this.containerDelete.hide();
            }

            var labelNoResults = this.container.find(".no_results");
            var preList = this.currentView.list;
            var curList = [];
            for (var i = 0; i < preList.length; i++) {
                var index = preList[i].label.indexOf(keywords);
                var elem = this.container.find('.item[value="' + preList[i].value + '"]');
                elem.show();
                if (index >= 0) {
                    curList.push(preList[i]);
                } else {
                    elem.hide();
                }
            }
            if (!T.islist(curList)) {
                labelNoResults.removeClass("hidden");
            } else {
                labelNoResults.addClass("hidden");
            }
            this.sizeHandler(this.currentView);
            this.currentView.scrollPane.update();
            return this;
        },
        //===============================================
        drawInput: function(view, item) {
            var elem = $("<div/>").addClass("ma_date_picker_custom");
            view.scrollPane.append(elem);
            if (item.title) {
                $("<div/>").addClass("title").html(item.title).appendTo(elem);
            }

            var dateFormat = T.tostr(this.option.autocomplete.dateFormat);
            dateFormat = dateFormat.replace("mm", "MM");
            var placeholder = T.dateFormat(item.placeholder, dateFormat);
            var input = $('<input type="text" />').addClass("input").appendTo(elem);

            this.setPlaceHolder(input, placeholder);

            item.input = input;

            var holder = $("<div/>").addClass("ma_date_editor_dropdown");
            view.scrollPane.append(holder);
            item.holder = holder;
            item.hint = null;
            this.dateAutocomplete.add(item);
        },

        drawDropDown: function(view, item) {
            var elem = $("<div/>").addClass("ma_date_picker_custom");
            view.scrollPane.append(elem);

            var value = view.parentView.value || "";
            if (item.title) {
                $("<div/>").addClass("title").html(item.title + " " + value).appendTo(elem);
            }
            $('<input type="text" />').addClass("input select_input").attr({ id: "editor_select" }).val(item.value).appendTo(elem);

            var getHtml = function() {
                var itemList = item.list;
                var option = $("<div/>").addClass("ma_date_editor_select").attr({ id: "editor_select" });
                for (var i = 0; i < itemList.length; i++) {
                    var elemList = $("<span/>").addClass("select_item pointer").attr({
                        value: itemList[i]
                    }).data("data", itemList[i]).html(itemList[i]);
                    option.append(elemList);
                }
                return option;
            };

            view.scrollPane.append(getHtml());
            var inputEle = this.find(".input.select_input");
            var dropDownEle = this.find(".ma_date_editor_select");
            var self = this;
            inputEle.on("click", function() {
                dropDownEle.show();
                dropDownEle.css("height", "auto");
                self.sizeHandler(view);
            });

            dropDownEle.on("click", ".select_item", function(e) {
                var elem = $(this);
                var data = elem.data("data");
                item.value = data;
                item.label = data;
                inputEle.val(data);
                dropDownEle.css("height", "0px");
                self.sizeHandler(view);
                dropDownEle.hide();
            });


            view.scrollPane.on("click", function(e) {
                var ele = e.target;
                if (ele.id === "editor_select") {
                    dropDownEle.show();
                    dropDownEle.css("height", "auto");
                    self.sizeHandler(view);
                    return;
                }
                dropDownEle.css("height", "0px");
                self.sizeHandler(view);
                dropDownEle.hide();

            });

        },


        //==================================================
        btDoneHandler: function(e) {

            var id = this.currentView.id;
            var func = this["show_" + id + "_handler"];
            if (typeof(func) !== "function") {
                return this;
            }
            func.call(this);
            return this;
        },

        //always back to parent view
        btBackHandler: function(e) {

            var parentView = this.currentView.parentView;

            if (!parentView) {
                return this;
            }
            if (parentView.id !== "create_from_existing") {
                if (!this.containerSearch.hasClass("hidden")) {
                    this.containerSearch.addClass("hidden");
                }
            }
            this.showView(parentView.id, true);

            return this;
        }

    });

    return DateEditor;
});