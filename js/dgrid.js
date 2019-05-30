function DGrid(id) {

    //property
    this.id = id;
    this.Columns = null;
    this.data = null;
    this.uniqueFields = [];
    this.editingCount = 0;
    this.keyColIdx = -1;
    this.keyColName = null;
    this.displayRecordCount = 0;//displayRecordCount
    this.htmlElement = function () {
        return document.getElementById(this.id);
    };
    this.disableDelete = false;
    this.disableEdit = false;
    this.disableCreate = false;
    this.enableDetails = false;

    this.load = function () {
        //init header
        this.loadHeaderRow();
        //init content template
        this.loadContentRowTemplate();
        //init content by data
        this.loadContentRow();
        //init event with action button
        this.initActionEvent();

        this.reloadInputChecking();

        this.editingCount = 0;//reset edit count after reload

        if (this.allowPaging) {
            this.renderPagingFooter();
        }
    };

    this.checkRequired = function (row) {
        var result = true;
        var grid = this;
        var columns = this.Columns;
        var data = this.data;

        if (columns != null) {
            var keyFieldValue = null;
            var idx = -1;

            for (var i = 0; i < columns.length; i++) {
                var tcol = columns[i];
                var fieldName = tcol.name;
                var val = null;

                var input;
                if (tcol.source != null && tcol.source.length > 0) {
                    //select 
                    val = row.find("." + fieldName + "").find("select option:selected").val();
                    input = row.find("." + fieldName + "").find("select option:selected");
                } else {
                    //input
                    val = row.find("." + fieldName + "").find("input").val();
                    input = row.find("." + fieldName + "").find("input");
                }
                if (tcol.required != null && tcol.required == 1) {
                    if (val == "") {

                        input.toggleClass("invalid");
                        setTimeout(function () {
                            input.toggleClass("invalid");
                        }, 2000);
                        result = false;
                        break;
                    }
                }
            }
        }
        return result;
    };

    //CRUD
    this.AddNewRow = function () {

        if (this.disableCreate) {
            return;
        }
        var row = $("#" + this.id + " tr:eq(1)").clone(true);
        row.removeClass("sr-only");
        $("#" + this.id + ">tbody").append(row);
        this.EditRow(row);
        this.RowRendered(row);
        this.HideAddButton();
    };
    this.EditRow = function (row) {

        if (this.disableEdit) {
            return;
        }
        this.editingCount++;
        $("td", row).each(function () {
            if ($(this).find("input").length > 0) {
                $(this).find("input").show();

                $(this).find("span").hide();
            }
            if ($(this).find("select").length > 0) {
                $(this).find("select").show();
                //$(this).find("select").change();
                $(this).find("span").hide();
            }
        });
        row.find(".Update").show();
        row.find(".Cancel").show();
        row.find(".Delete").hide();
        row.find(".Edit").hide();

        this.StartedEditRow(row);
    };
    this.StartedEditRow = function (row) {
        //for developer Customize    
    };
    this.UpdateRow = function (row) {


        if (this.disableEdit) {
            return;
        }

        var grid = this;
        var columns = this.Columns;
        var data = this.data;
        if (columns != null) {
            var keyFieldValue = null;
            var idx = -1;
            var record = [];
            for (var i = 0; i < columns.length; i++) {
                var tcol = columns[i];
                var fieldName = tcol.name;
                var val = null;
                if (tcol.source != null && tcol.source.length > 0) {
                    //select 
                    val = row.find("." + fieldName + "").find("select option:selected").val();

                } else {
                    //input
                    val = row.find("." + fieldName + "").find("input").val();
                }

                if (i == grid.keyColIdx) {
                    keyFieldValue = val;
                    if (data != null) {
                        for (var j = 0; j < data.length; j++) {
                            if (data[j][fieldName] == keyFieldValue) {
                                idx = j;//find index in Js array
                                break;
                            }
                        }
                    }
                }
                record[fieldName] = val;
            }
            //finish put data to record[]

            //check duplicate here
            var isDuplicate = false;
            if (grid.uniqueFields.length > 0) {
                for (var dl = 0; dl < data.length; dl++) {
                    if (!isDuplicate) {

                        for (var dp = 0; dp < grid.uniqueFields.length; dp++) {
                            var ufield = grid.uniqueFields[dp];

                            if (data[dl][ufield].trim() == record[ufield].trim()) {
                                //duplicate field found
                                if (data[dl][grid.keyColName] != record[grid.keyColName])//ignore edit
                                {
                                    isDuplicate = true;
                                    grid.duplicateFieldFound(ufield, record[ufield], grid.findColDisplayName(ufield));//call duplicate message function.  user can overwrite it
                                    grid.setInputFieldInvalid(row, false, ufield);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            if (!isDuplicate) {
                if (idx != -1) {
                    //update
                    data[idx] = record;

                } else {
                    //create
                    var newID = 1;
                    if (data.length > 0) {
                        newID = parseFloat(data[data.length - 1].id) + 1;
                    }
                    record[this.keyColName] = newID;
                    record.newAdd = 1;
                    data[data.length] = record;
                }
                this.UpdatedRow(row);
                this.editingCount--;
                //update UI
                grid.load();

                this.ShowAddButton();
            }
        }
    };
    this.UpdatedRow = function (row) {
        //for developer Customize 
    };
    this.DeleteRow = function (row) {

        //if (this.disableDelete) {
        //    return;
        //}

        var grid = this;

        var index = this.findContentRowIndex(row);


        var keyValue = row.find("." + this.keyColName + " span").html();


        if (index < 0) {
            //not allow remove row 0
            return;
        } else if (index >= 0) {
            //find row index by key value
            var delRowIdx = grid.findDataRowIndex(keyValue);
            if (delRowIdx >= 0) {
                //delete row
                grid.data.splice(delRowIdx, 1);

            }
            this.DeletedRow(row);
            //update UI
            grid.load();

        }


    };
    this.DeletedRow = function (row) { };
    this.CancelEditRow = function (row) {

        if (this.disableEdit) {
            return;
        }
        $("td", row).each(function () {
            if ($(this).find("input").length > 0) {
                var span = $(this).find("span");
                var input = $(this).find("input");
                input.val(span.html());
                span.show();
                input.hide();
            }
            if ($(this).find("select").length > 0) {
                var span = $(this).find("span");
                var input = $(this).find("select");

                selectOptionByText(input, span.html());

                span.show();
                input.hide();
            }
        });
        row.find(".Edit").show();
        row.find(".Delete").show();
        row.find(".Update").hide();
        row.find(".Cancel").hide();

        this.editingCount--;
        this.CancelledEditRow(row);

        this.ShowAddButton();
    };
    this.CancelledEditRow = function (row) {
        //for developer Customize 
    };

    //find row or value
    this.findDataRow = function (keyval) {
        if (this.keyColIdx != -1) {
            if (this.data != null) {
                for (var i = 0; i < this.data.length; i++) {
                    if (this.data[i][this.keyColName] == keyval) {
                        return this.data[i];
                    }
                }
            }
        }
        return null;
    };

    this.findDataRowIndex = function (keyval) {
        if (this.keyColIdx != -1) {
            if (this.data != null) {
                for (var i = 0; i < this.data.length; i++) {
                    if (this.data[i][this.keyColName] == keyval) {
                        return i;
                    }
                }
            }
        }
        return -1;

    };

    this.findContentRowIndex = function (row) {
        //-1 = header tr, -1 = sr-only template row
        return ($("#" + this.id).find("tr")).index(row) - 2;
    };

    this.findContentRow = function (index) {
        //+1 = header tr, +1 = sr-only template row
        return ($("#" + this.id).find("tr"))[index + 2];
    };

    this.findRowValue = function (contentRow, fieldname) {
        if (this.Columns != null) {

            for (var i = 0; i < this.Columns.length; i++) {
                var col = this.Columns[i];


                if (col.name == fieldname) {
                    if (col.source != null && col.source.length > 0) {
                        //select
                        return contentRow.find("." + fieldname + " select option[selected=\"selected\"]").val();
                    }
                    else {
                        //input
                        return contentRow.find("." + fieldname + " input").val();
                    }

                }
            }
        }
        return null;
    }

    this.loadHeaderRow = function () {
        if (this.Columns != null) {
            var colStr = "";
            for (var i = 0; i < this.Columns.length; i++) {
                var tcol = this.Columns[i];

                //if (tcol.hide == 1)
                //{
                //    continue;
                //}

                var header = "";
                if (tcol.displayText != null) {

                    header = tcol.displayText;
                } else {
                    header = tcol.name;
                }

                if (this.allowSorting) {

                    header = "<a href=\"javascript:" + this.id + ".sortColumns('" + tcol.name + "');\">" + header + "</a>";
                }



                var rowCss = "";
                if (tcol.hide == 1) {
                    rowCss = "sr-only";
                }

                colStr += " <th scope=\"col\" class='" + rowCss + "'>" + header + "</th>";


                if (tcol.key != null && tcol.key == 1) {
                    if (this.keyColIdx == -1) {
                        //only get 1 times
                        this.keyColIdx = i;//get the key index and will using in next function
                        this.keyColName = tcol.name;
                    }
                }

            }
            var header = $("#" + this.id + ">thead");
            header.html('');
            if (header.length > 0) {
                colStr += "<th scope=\"col\"><span>" + this.ActionHeader + "</span></th>";

                header.append("<tr>" + colStr + "</tr>");
            }

        } else {
            console.log("please define Columns before call load method")
        }
    };

    this.loadContentRowTemplate = function () {
        if (this.Columns != null) {
            var body = $("#" + this.id + ">tbody");
            body.html('');
            var bodyStr = "";
            if (this.Columns.length > 0) {
                //add blank sr-only record as template row
                var tmpRow = "";
                if (this.Columns != null) {
                    var colStr = "";

                    for (var i = 0; i < this.Columns.length; i++) {
                        var tcol = this.Columns[i];
                        var addstyle = "";
                        var addAttr = "";
                        var cssClass = "";

                        if (tcol.readonly == 1 || i == this.keyColIdx) {
                            addAttr += " readonly=\"readonly\"";
                        }
                        if (tcol.maxlength != null && tcol.maxlength > 0) {
                            addAttr += " maxlength=\"" + tcol.maxlength + "\"";
                        }

                        if (tcol.max != null) {
                            addAttr += " max=\"" + tcol.max + "\"";
                        }
                        if (tcol.min != null) {
                            addAttr += " min=\"" + tcol.min + "\"";
                        }

                        //if (tcol.required != null && tcol.required == 1) {
                        //    addAttr += " required=\"required\"";
                        //}



                        if (tcol.width != null && tcol.width != "") {
                            addstyle += " width:" + tcol.width + ";";
                        }

                        if (tcol.cssClass != null) {
                            cssClass += tcol.cssClass;
                        }

                        var rowcss = "";
                        if (tcol.hide == 1) {
                            rowcss += "sr-only";
                        }

                        colStr += " <td scope=\"row\" class=\"" + tcol.name + " " + rowcss + "\">";
                        colStr += " <span></span>";

                        if (tcol.source != null && tcol.source.length > 0) {
                            //contain datasource should be dropdown
                            colStr += "<select class=\"" + cssClass + "\" style=\"display:none;" + addstyle + "\">";
                            for (var j = 0; j < tcol.source.length; j++) {
                                var s = tcol.source[j];
                                var otext = s.text;
                                var oval = s.value;

                                colStr += "<option value='" + oval + "'>" + otext + "</option>";
                            }

                            colStr += "</select>";
                        }
                        else {
                            //normal Textbox
                            var type = "text";
                            if (tcol.type != null) {
                                type = tcol.type;
                            }

                            if (tcol.list != null) {
                                addAttr += " list=\"" + tcol.list + "\"";
                            }



                            colStr += "<input type=\"" + type + "\" class=\"paper text_field　" + cssClass + "\" style=\"display:none;" + addstyle + "\" " + addAttr + " />";
                        }
                        colStr += "</td>";

                    }

                    //add Action td
                    colStr += "<td>";
                    if (!this.readonly) {
                        if (!this.disableEdit) {
                            colStr += "<a class=\"Edit\" href=\"javascript:;\" title=\"Edit\"><i class=\"fa fa-pencil\"></i></a>";
                            colStr += "<a class=\"Update\" href=\"javascript:;\" style=\"display:none\" title=\"Update\"><i class=\"fa fa-floppy-o\"></i></a>";
                            colStr += "<a class=\"Cancel\" href=\"javascript:;\" style=\"display:none\" title=\"Cancel\" data-toggle=\"tooltip\"><i class=\"fa fa-ban\"></i></a>";
                        }
                        if (!this.disableDelete) {
                            colStr += "<a class=\"Delete\" href=\"javascript:;\" title=\"Delete\"><i class=\"fa fa-times\"></i></a>";
                        }
                    }
                    colStr += "</td>";


                    tmpRow = "<tr class=\"sr-only p-row\">" + colStr + "</tr>";//p-row = primary row
                    if (this.enableDetails) {
                        tmpRow += "<tr class=\"sr-only d-row\"><td></td><td colspan='" + (this.Columns.length - 1) + "'>{{" + this.id + "_drow}}</td></tr>";//d-row = details row
                    }
                }

                var ctx = $("#" + this.id + ">tbody");
                ctx.html('');
                ctx.append(tmpRow);



            }
        }
    };

    this.RowRendered = function (row) {
        //can custom make event here 

    };

    this.loadContentRow = function () {
        if (this.data != null) {

            this.displayRecordCount = 0;

            for (var i = 0; i < this.data.length; i++) {
                // this.AddNewRow();

                //
                var findText = false;

                var row = $("#" + this.id + " tr:eq(1)").clone(true);
                row.removeClass("sr-only");
                $("#" + this.id + ">tbody").append(row);

                this.RowRendered(row);



                if (this.enableDetails) {
                    var drow = $("#" + this.id + " tr:eq(2)").clone(true);
                    drow.removeClass("sr-only");
                    $("#" + this.id + ">tbody").append(drow);
                }

                //

                //var row = $("#" + this.id + " tr:last");//get created Row
                //this.CancelEditRow(row);
                var d = this.data[i];

                if (this.Columns != null) {
                    for (var j = 0; j < this.Columns.length; j++) {
                        var colName = this.Columns[j].name;

                        var cellsValue = d[colName];//for text only
                        var tcol = this.Columns[j];
                        if (tcol.source != null && tcol.source.length > 0) {
                            //for dropdown select
                            var sourceVal = -1;
                            for (var k = 0; k < tcol.source.length; k++) {
                                if (tcol.source[k].value == cellsValue) {
                                    sourceVal = cellsValue;
                                    cellsValue = tcol.source[k].text;
                                    break;
                                }
                            }
                            row.find("." + colName + ">select").val(sourceVal);
                        } else {
                            row.find("." + colName + ">input").val(cellsValue);
                        }
                        row.find("." + colName + ">span").html(cellsValue);

                        if (cellsValue != null && typeof (cellsValue) != 'undefined') {
                            if ((cellsValue.toString().toLowerCase().indexOf(searchText.toLowerCase()) != -1)) {
                                findText = true;
                                if (this.allowFiltering && searchText != null && searchText != "") {
                                    row.find("." + colName + ">span").toggleClass("highlight");
                                }
                            }
                        }


                        if (this.enableDetails) {

                            //add details row
                            if (d['drow'] != null && d['drow'] != "") {
                                drow.html(drow.html().replace('{{' + this.id + '_drow}}', d['drow']));



                                //search filter
                                if (j == this.Columns.length-1) {
                                    var drowVal = d['drow'];

                                    if (drowVal != null && typeof (drowVal) != 'undefined') {
                                        if ((drowVal.toString().toLowerCase().indexOf(searchText.toLowerCase()) != -1)) {
                                            findText = true;
                                            if (this.allowFiltering && searchText != null && searchText != "") {


                                                drow.find("div>div>div").each(function (index) {
                                                    if ($(this).html().toLowerCase().indexOf(searchText.toLowerCase()) != -1) {
                                                        $(this).toggleClass("highlight");
                                                    }
                                                });

                                            }
                                        }
                                    } 
                                } 
                            }
                            else {
                                drow.hide();
                            }
                        }
                    }
                    this.displayRecordCount++;
                    if (this.allowFiltering && searchText != null && searchText != "" && findText == false) {
                        //search check
                        this.displayRecordCount--;
                        row.hide();

                        if (this.enableDetails) {
                            drow.hide();
                        }
                    }
                    else {
                        //Paging Check
                        if (this.allowPaging) {
                            var startRange = ((parseFloat(this.currentPage) - 1) * parseFloat(this.RowPerPage)) + 1;
                            var endRange = ((parseFloat(this.currentPage)) * parseFloat(this.RowPerPage));
                            if (this.displayRecordCount >= startRange && endRange >= this.displayRecordCount) {
                                //record to show

                            } else {
                                //record to hide
                                row.hide();
                            }
                        }
                    }

                    if (!this.allowPaging) {
                        if (i % 20 == 0) {
                            row.toggleClass("pagebreak-before");
                        }
                    }

                }

                // for loop
            }
        }
    };

    this.initActionEvent = function () {

        var data = this.data;
        var columns = this.Columns;
        var grid = this;

        if (!this.disableEdit) {
            //Edit event handler.

            $("#" + this.id + " .Edit").unbind("click");
            $("#" + this.id + " .Edit").on("click", function () {
                var row = $(this).closest("tr");
                grid.EditRow(row);
            });

            //Cancel event handler.
            $("#" + this.id + " .Cancel").unbind("click");
            $("#" + this.id + " .Cancel").on("click", function () {
                var row = $(this).closest("tr");
                if (confirm(grid.confirmCancelMsg)) {
                    grid.CancelEditRow(row);
                    //delete row if still not save before
                    if (grid.findRowValue(row, grid.keyColName) == "") {
                        grid.DeleteRow(row);
                    }
                }
            });

            //update event handler.  
            $("#" + this.id + " .Update").unbind("click");
            $("#" + this.id + " .Update").on("click", function () {
                var row = $(this).closest("tr");
                if (grid.checkRequired(row)) {
                    grid.UpdateRow(row);
                }
            });
        }

        if (!this.disableDelete) {

            //delete event handler.
            $("#" + this.id + " .Delete").unbind("click");
            $("#" + this.id + " .Delete").on("click", function () {
                var row = $(this).closest("tr");
                if (confirm(grid.confirmDelMsg)) {
                    grid.DeleteRow(row);
                }
            });
        }

    };

    this.isEditing = function () {
        return (this.editingCount > 0) ? true : false;
    };

    this.reloadInputChecking = function () {


        $('#' + this.id + ' input[type="number"]').keyup(function (e) {
            this.value = this.value.replace(/[^0-9-]/i, '');

            if (this.attributes["max"] != null) {
                if (parseFloat(this.value) > parseFloat(this.attributes["max"].value)) {
                    this.value = this.attributes["max"].value;
                }
            }



            if (this.attributes["min"] != null) {
                if (parseFloat(this.value) < parseFloat(this.attributes["min"].value)) {
                    this.value = this.attributes["min"].value;
                }
            }

        });

        $('#' + this.id + ' input[type="number"]').change(function (e) {
            this.value = this.value.replace(/[^0-9-]/i, '');
            if (this.value == '') {
                this.value = '0';
            }

            if (this.attributes["max"] != null) {
                if (parseFloat(this.value) > parseFloat(this.attributes["max"].value)) {
                    this.value = this.attributes["max"].value;
                }
            }


            if (this.attributes["min"] != null) {
                if (parseFloat(this.value) < parseFloat(this.attributes["min"].value)) {
                    this.value = this.attributes["min"].value;
                }
            }
        });


    };

    this.getAddButton = function () {
        return $("#btn" + this.id + "Add");
    };

    this.ShowAddButton = function () {
        if (!this.disableCreate) {
            $("#btn" + this.id + "Add").show();
        }
    };

    this.HideAddButton = function () {
        $("#btn" + this.id + "Add").hide();
    };

    this.JSONdata = function () {
        var json = [];
        if (this.data != null) {
            for (var j = 0; j < this.data.length; j++) {
                var item = {
                };

                var d = this.data[j];
                for (var i = 0; i < this.Columns.length; i++) {
                    var tcol = this.Columns[i];
                    item[tcol.name] = d[tcol.name];
                    if (item.newAdd != null && item.newAdd == 1) {
                        item[this.keyColName] = -1;
                    }
                }
                json.push(item);
            }
            return json;
        }
        return null;
    }

    this.loadDataToHiddenField = function () {
        $("#" + this.getHiddenFieldID()).val(JSON.stringify(this.JSONdata()));
    };

    this.getHiddenFieldID = function () {
        return this.id + "_value";
    };

    this.findColDisplayName = function (colname) {
        var displayName = null;
        var columns = this.Columns;
        if (columns != null) {
            for (var i = 0; i < columns.length; i++) {
                var tcol = this.Columns[i];
                if (tcol.name == colname) {
                    if (tcol.displayName != null && tcol.displayName != '') {
                        displayName = tcol.displayName;
                    } else {
                        displayName = colname;
                    }
                    break;
                }
            }
        }
        return displayName;
    }

    this.findDetailsRow = function (prow) {


    };
    this.ActionHeader = "#";

    this.confirmCancelMsg = "Are you sure to Cancel?  ";

    this.confirmDelMsg = "Are you sure to Delete?  ";

    this.readonly = false;

    //for Sorting
    this.allowSorting = false;

    var sortASC = false;

    this.sortColumns = function (colName) {
        if (!this.allowSorting) {
            return;
        }
        sortASC = !sortASC;

        var sortA = sortASC;

        this.data.sort(
            function (a, b) {

                var aVal = a[colName];
                if (isNumber(aVal)) {
                    aVal = parseFloat(aVal);
                }
                var bVal = b[colName];
                if (isNumber(bVal)) {
                    bVal = parseFloat(bVal);
                }


                if (sortA) {
                    if (aVal < bVal)
                        return -1;
                    if (aVal > bVal)
                        return 1;
                }
                else {
                    if (aVal > bVal)
                        return -1;
                    if (aVal < bVal)
                        return 1;
                }
                return 0;
            });
        this.load();
        if (!this.disableCreate && !this.readonly) {
            this.ShowAddButton();
        }
    }

    //for filtering
    this.allowFiltering = false;
    var searchText = "";
    this.search = function (text) {
        if (!this.allowFiltering) {
            console.log('Please set allowFiltering = true before using search feature');
        }

        searchText = text;//set search text
        this.currentPage = 1;//set back to 1st page
        this.load();//when allow filtering and searchtext set, will handle filter when reload the table
    }


    //paging
    this.allowPaging = false;
    this.currentPage = 1;
    this.RowPerPage = 20;//default 20;

    this.renderPagingFooter = function () {
        var parentElement = this.htmlElement().parentElement;
        var footerElementId = this.id + "_footer";

        var footerElement;
        if (document.getElementById(footerElementId) == null) {
            //element not existing
            footerElement = document.createElement("div");
            footerElement.id = footerElementId;
            parentElement.appendChild(footerElement);
        }
        else {
            //using existing element
            footerElement = document.getElementById(footerElementId, this);
        }
        reloadFooterPaging(footerElement, this);

        parentElement.appendChild(footerElement);
    }

    var reloadFooterPaging = function (footerElement, grid) {
        //var recordCount 
        var displayRecordCount = grid.displayRecordCount;
        $("#" + footerElement.id).html("");//clear footer


        //calc how many page
        var totalPageCount = parseFloat(displayRecordCount) / parseFloat(grid.RowPerPage);
        totalPageCount = totalPageCount.toFixed(0);

        if (parseFloat(displayRecordCount) > parseFloat(grid.RowPerPage) * totalPageCount) {

            if ((parseFloat(displayRecordCount) % parseFloat(grid.RowPerPage)) > 0) {
                totalPageCount++;
            }
        }

        //render href
        if (totalPageCount > 1) {

            var footerhtml = "<nav><ul class=\"pagination\">";

            for (var i = 0; i < totalPageCount; i++) {
                footerhtml += "<li class=\"page-item\"><a class=\"page-link\" href=\"javascript:" + grid.id + ".changePage(" + (i + 1).toString() + ");\">" + (i + 1).toString() + "</a></li>";

                //create a href for switch paging
                //var createA = document.createElement("a");
                //var createAText = document.createTextNode((i + 1).toString() + " ");
                //createA.setAttribute('href', "javascript:" + grid.id + ".changePage(" + (i + 1) + ");");
                //createA.appendChild(createAText);
                //footerElement.appendChild(createA);
            }

            footerhtml += "</ul></nav>";
            $("#" + footerElement.id).html(footerhtml);
        }
    };

    this.changePage = function (page) {
        this.currentPage = page;
        this.load();

    };

    //validation
    this.checkAllRowValidate = function () {
        var result = true;

        if (this.data != null && this.data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                if (this.Columns != null) {
                    for (var j = 0; j < this.Columns.length; j++) {
                        //find required col
                        var tcol = this.Columns[j];
                        if (tcol.required != null && tcol.required == 1) {
                            var row = this.findContentRow(i);
                            //check is it empty
                            if (!(data[i][tcol.name] != null && data[i][tcol.name] != "")) {
                                //found required and it is empty
                                result = false;
                                if (!$(row).hasClass("InvalidBG")) {
                                    $(row).toggleClass("InvalidBG");
                                }
                                break;
                            }
                            else {
                                //clear invalid if is is valid
                                if ($(row).hasClass("InvalidBG")) {
                                    $(row).toggleClass("InvalidBG");
                                }
                            }
                        }
                    }
                }
            }
        }
        else {
            result = false;
        }
        return result;
    };

    this.duplicateFieldFound = function (fieldNamem, value, displayText) {
        alert("[" + displayText + ": " + value + "] not allow duplicate");
    };

    this.setInputFieldInvalid = function (row, isvalid, field) {

        var input = $(row).find("." + field + "> input");

        input.toggleClass("invalid");
        setTimeout(function () {
            input.toggleClass("invalid");
        }, 2000);

    };
};



function isNull(obj) {
    return !(obj != null && typeof (obj) != 'undefined');
}


function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
