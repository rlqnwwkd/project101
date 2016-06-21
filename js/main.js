/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and	
 * limitations under the License.
 */



/*global indexedDB, openDatabase*/
/*gear s2 Trainee global variable name*/

var DB_VERSION = 5, //Tizen local DB version
	TraineeId = 3, // TraineeID 
	yy = 0, // year
	mm = 0, //month
	dd = 0, //day
    DB_NAME = "GearTrainee",	 
    DB_DISPLAY_NAME = "GearTrainee_db",
    DB_SIZE = 2 * 1024 * 1024, 
    DB_TABLE_NAME = "tizenGearTrainee",
    dataTypeList = ["id", "food", "quantity", "insertDay"], //Tizen Diet List table 
    pageList = ["pageInput", "pageResult","pageInit","pageSchedule"],
    db,
    dbType = "none",
    idbObjectStore,
    popupStatus = "Deactive",
    pageNow = "pageInit";




function onSuccess(e) {
    console.log("Success : " + e.message);
}

function onError(e) {
    console.warn("Error : " + e.message);
}

function addLeadingZero(number, digit) {
    var n = number.toString(),
        i,
        strZero = "";

    for (i = 0; i < digit - n.length; i++) {
        strZero += '0';
    }

    return strZero + n;
}

function getDateTime() {
    var day = new Date();

    return (addLeadingZero(day.getMonth() + 1, 2) + "/" + addLeadingZero(day.getDate(), 2) + " " +
        addLeadingZero(day.getHours(), 2) + ":" + addLeadingZero(day.getMinutes(), 2));
}

function emptyElement(elm) {
    while (elm.firstChild) {
        elm.removeChild(elm.firstChild);
    }

    return elm;
}

function closePopup() {
    var divPopup = document.querySelector("#divPopup");

    divPopup.style.display = "none";
    popupStatus = "Deactive";
}
/*showPopup 
 * */
function showPopup(message, type, callbackList) {
     
    var divPopup = document.querySelector("#divPopup"),
        divDetail = document.querySelector("#divPopupDetail"),
        divFooter = document.querySelector("#divPopupFooter"),
        objButton;

    if (!message || !type || popupStatus === "Active") {
        return false;
    }

    switch (type) {
        case "OK":
            emptyElement(divFooter);

            objButton = document.createElement("div");
            objButton.className = "btnPopupOK";
            objButton.appendChild(document.createTextNode("OK"));
            if (callbackList && callbackList.cbOK && typeof(callbackList.cbOK) === "function") {
                objButton.addEventListener("click", function() {
                    callbackList.cbOK();
                    closePopup();
                });
            } else {
                objButton.addEventListener("click", function() {
                    closePopup();
                });
            }
            divFooter.appendChild(objButton);

            emptyElement(divDetail);
            divDetail.appendChild(document.createTextNode(message));

            divPopup.style.display = "block";
            popupStatus = "Active";

            break;
        case "OKCancel":
            emptyElement(divFooter);

            objButton = document.createElement("div");
            objButton.className = "btnPopupOKHalf";
            objButton.appendChild(document.createTextNode("OK"));
            // register OK Button
            if (callbackList && callbackList.cbOK && typeof(callbackList.cbOK) === "function") {
                objButton.addEventListener("click", function() {
                    callbackList.cbOK();
                    closePopup();
                });
            } else {
                objButton.addEventListener("click", function() {
                    closePopup();
                });
            }
            divFooter.appendChild(objButton);

            objButton = document.createElement("div");
            objButton.className = "btnPopupCancelHalf";
            objButton.appendChild(document.createTextNode("Cancel"));
            // register cancel button
            if (callbackList && callbackList.cbCancel && typeof(callbackList.cbCancel) === "function") {
                objButton.addEventListener("click", function() {
                    callbackList.cbCancel();
                    closePopup();
                });
            } else {
                objButton.addEventListener("click", function() {
                    closePopup();
                });
            }
            divFooter.appendChild(objButton);

            emptyElement(divDetail);
            divDetail.appendChild(document.createTextNode(message));

            divPopup.style.display = "block";
            popupStatus = "Active";

            break;
        default:
            emptyElement(divFooter);

            objButton = document.createElement("div");
            objButton.className = "btnPopupOK";
            objButton.appendChild(document.createTextNode("Close"));
            divFooter.appendChild(objButton);

            emptyElement(divDetail);
            divDetail.appendChild(document.createTextNode(message));

            divPopup.style.display = "block";
            popupStatus = "Active";
    }

    return true;
}

//After the database is opened, the application creates a table to the database if none exists
function createTable(db) {
    if (dbType === "IDB") {
        if (db.objectStoreNames.contains(DB_TABLE_NAME)) {
            db.deleteObjectStore(DB_TABLE_NAME);
        }

        idbObjectStore = db.createObjectStore(DB_TABLE_NAME, {
            keyPath: "id",
            autoIncrement: true
        });
    } else if (dbType === "SQL") {
        db.transaction(function(t) {
            t.executeSql("CREATE TABLE if not exists " + DB_TABLE_NAME + " (id INTEGER PRIMARY KEY, food TEXT, quantity INTEGER, insertDay DATETIME)", []);
        });
    } else {
        alert("Error createTable: no DBtype");
    }
}

// Insert a data to the table
function insertData(db, data) {
    if (dbType === "IDB") {
        idbObjectStore = db.transaction(DB_TABLE_NAME, "readwrite").objectStore(DB_TABLE_NAME);
        idbObjectStore.put(data);
    } else if (dbType === "SQL") {
        db.transaction(function(t) {
            var dayString;

            dayString = getDateTime();
            t.executeSql("INSERT INTO " + DB_TABLE_NAME + " (food, quantity, insertDay) VALUES (?, ?, ?)", [data.food, data.quantity, dayString]);
        });
    }
}

// Delete a data from the table
function deleteData(db, data) {
    if (dbType === "IDB") {
        idbObjectStore = db.transaction(DB_TABLE_NAME, "readwrite").objectStore(DB_TABLE_NAME);
        idbObjectStore.delete(data.id);
    } else if (dbType === "SQL") {
        db.transaction(function(t) {
            t.executeSql("DELETE FROM " + DB_TABLE_NAME + " WHERE id = ?", [data.id]);
        });
    }
}

// Delete all data from the table
function deleteDataAll(db) {
    if (dbType === "IDB") {
        idbObjectStore = db.transaction(DB_TABLE_NAME, "readwrite").objectStore(DB_TABLE_NAME);
        idbObjectStore.clear();
    } else if (dbType === "SQL") {
        db.transaction(function(t) {
            t.executeSql("DELETE FROM " + DB_TABLE_NAME + " WHERE id > 0", []);
        });
    }
}

function createDeleteCallback(i, objTable, objRow) {
    var retFunc = function() {
        var data = {
            id: i,
            table: objTable,
            row: objRow
        };

        showPopup("Do you want to delete the Data " + i + "?", "OKCancel", {
            cbOK: function() {
                deleteData(db, data);
                data.table.removeChild(data.row);
            },
            cbCancel: null
        });
    };

    return retFunc;
}

function showDataView(dataArray) {
    var objResultContents = document.querySelector("#resultDetail"),
        objTable,
        objRow,
        objCol,
        i,
        j,
        prop;

    emptyElement(objResultContents);

    objTable = document.createElement("div");
    objTable.className = "resultTable";

    for (i = 0; i < dataArray.length; i++) {
        objRow = document.createElement("div");
        objRow.className = "resultTableRow";
        for (j = 0; j < dataTypeList.length; j++) {
            prop = dataTypeList[j];
            if (dataArray[i].hasOwnProperty(prop)) {
                objCol = document.createElement("div");
                if (prop === "id") {
                    objCol.addEventListener("click", createDeleteCallback(dataArray[i][prop], objTable, objRow));
                }
                objCol.className = prop + "Detail";
                objCol.appendChild(document.createTextNode(dataArray[i][prop]));

                objRow.appendChild(objCol);
            }
        }

        objTable.appendChild(objRow);
    }

    objResultContents.appendChild(objTable);
}

/*To get data from the database whether dbtype IDB or SQL check 
 * if dbtype IDB use the Cursor object of the Indexed Database API 
 * Cursor objects implement the following interface 
 * direction of type IDBCursorDirection, readonly On getting, provide the traversal direction of the cursor.
 * key of type any, readonly Returns the cursor's current key
 * primaryKey of type any, readonly Returns the cursor's current effective key.
 * source of type (IDBObjectStore or IDBIndex), readonly On getting
 * 
 * */
function loadDataView(db) {
    var resultBuffer = [];

    if (dbType === "IDB") {
        idbObjectStore = db.transaction(DB_TABLE_NAME, "readonly").objectStore(DB_TABLE_NAME);
        idbObjectStore.openCursor().onsuccess = function(e) {
            var cursor = e.target.result;

            if (cursor) {
                resultBuffer.push(cursor.value);
                cursor.continue();
            } else {
                showDataView(resultBuffer);

                return resultBuffer;
            }
        };
    } else if (dbType === "SQL") { 
        db.transaction(function(t) {
            t.executeSql("SELECT * FROM " + DB_TABLE_NAME, [],
                function(t, r) {
                    var resultBuffer = [],
                        i;


                    
                    for (i = 0; i < r.rows.length; i++) {
                        resultBuffer.push({
                            id: r.rows.food(i).id || 0,
                            food: r.rows.food(i).food || "",
                            quantity: r.rows.food(i).quantity || 0,
                            insertDay: r.rows.food(i).insertDay || ""
                        });
                    }

                    showDataView(resultBuffer);

                    return resultBuffer;
                },
                function(t, e) {
                    alert("Error dataview: " + e.message);

                    return null;
                });
        });
    }
}

/*Open the database When the application starts, it attempts to open the database using the Indexed Database API
Use the indexedDB.open(DB_NAME, DB_VERSION) method to generate a database named TizenIndexedDB in order to create an object store for storage 
	check whether an indexed database is supported in the window object. If the database is generated properly, the onsuccess event handler is called.
	*/
function openDB(successCb) {
    var request;

    if (window.indexedDB) {
        dbType = "IDB";

        request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = function(e) {
            alert("Please allow this application to use Indexed DB");
        };
        request.onsuccess = function(e) {
            db = request.result;

            onSuccess({
                message: "Indexed DB loading complete"
            });

            if (successCb) {
                successCb(db);
            }
        };
        request.onupgradeneeded = function(e) {
            db = e.target.result;

            onSuccess({
                message: "Indexed DB upgrade needed"
            });

            createTable(db);
        };
    } else if (window.openDatabase) {
        dbType = "SQL";

        db = openDatabase(DB_NAME, DB_VERSION, DB_DISPLAY_NAME, DB_SIZE, function() {
            onSuccess({
                message: "Database Creation Complete"
            });
        });
        createTable(db);
    } else {
        onError({
            message: "Indexed DB/WebSQL is not supported"
        });
    }
}
/*submitNewRecord Food quantity 
 * data initialize food = noname quantity =0 
 * if not exists input food and quantity showerrorpopup  */
function submitNewRecord() {
    var data = {
            food: "NoName",
            quantity: 0
        },
        txtFood = document.querySelector("#txtFood"),
        txtquantity = document.querySelector("#txtquantity");

    if (!txtFood.value && !txtquantity.value) {
        showPopup("Food name and quantity data are needed.", "OK");

        return false;
    }

    if (txtFood.value) {
        data.food = txtFood.value;
    }
    if (txtquantity.value) {
        data.quantity = txtquantity.value;
    }
    data.insertDay = getDateTime();

    insertData(db, data);

    txtFood.value = "";
    txtquantity.value = "";

    return true;
}

function changePage(destPage) {
    var i,
        objPage;

    for (i = 0; i < pageList.length; i++) {
        objPage = document.querySelector("#" + pageList[i]);
        objPage.style.display = "none";
    }

    document.querySelector("#" + destPage).style.display = "block";
    pageNow = destPage;
}

function keyEventCB(event) {
    if (event.keyName === 'back') {
        if (popupStatus === "Active") {
            closePopup();
        } else if (pageNow === "pageInit") {
            try {
                tizen.application.getCurrentApplication().exit();
            } catch (ignore) {

            }
        } else {
            changePage("pageInit");
        }
    }
}

function setDefaultSize() {
    var divResult = document.querySelector("#resultDetail");

    if (document.height === 360) {
        divResult.style.height = (document.height - 80) + "px";
    } else {
        divResult.style.height = (document.height - 50) + "px";
    }
}




function setNfc() {
/* To get the default NFC adapter, use the getDefaultAdapter() method and
 *  prepare an ApplicationControl object (in mobile and wearable applications) to request the NFC switching operation:*/


	var nfcSwitchAppControl = new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/setting/nfc", null, null, null,
			[new tizen.ApplicationControlData("type", "nfc")]);
	var adapter = tizen.nfc.getDefaultAdapter();



   //Define the event listener for the launchAppControl() method
	function launchSuccess()
	{
		console.log("NFC Settings application has successfully launched.");
	}
	function launchError(error) 
	{
		console.log("An error occurred: " + error.name + ". Please enable NFC through the Settings application.");
	}
/*Define the event handler for an application control, 
which implements the ApplicationControlDataArrayReplyCallback interface */
	var serviceReply =
	{
			/* onsuccess is called when the launched application reports success */
			onsuccess: function(data)
			{
				if (adapter.powered)
				{
					alert("NFC is successfully turned on.");
				}
			},
			/* onfailure is called when the launched application reports failure of the requested operation */
			onfailure: function() 
			{
				alert("NFC Settings application reported failure.");
			}
	};

	if (adapter.powered)
	{
		alert("NFC is enabled");
	}
	else
	{
		alert("NFC is not enalbed. please check NFC Settings .");
		tizen.application.getCurrentApplication().exit();  // current application exit
		//tizen.application.launchAppControl(nfcSwitchAppControl, null, launchSuccess, launchError, serviceReply);
	}

/*Define the event handlers for NFC tag detection using the NFCTagDetectCallback listener interface */
	var setTagDetect =
	{
			/* When an NFC tag is detected */
			onattach: function(nfcTag)
			{
				alert("NFC Tag detected. Its type is: " + nfcTag.type);
			}
	,

	/* When an NFC tag becomes unavailable */
	ondetach: function()
	{
		alert("NFC Tag unavailable");
	}
	};

	/* Register the listener to use the defined event handlers.
You can limit the listener to detect only specific NFC tag types by defining the tag types as the second parameter of the setTagListener() method.
 In the gear Traiee App, only MIFARE tags are detected.
	 * Defines the tag types to be detected */
	var tagFilter = ["MIFARE_MINI", "MIFARE_1K", "MIFARE_4K", "MIFARE_ULTRA", "MIFARE_DESFIRE"];

	/* Registers the event listener */
	//nfcAdapter.setTagListener(setTagDetect, tagFilter);

}









function setDefaultEvents() {
    var btnSubmit = document.querySelector("#btnSubmit"),
        btnClear = document.querySelector("#btnClear"),
        btnInputPage = document.querySelector("#btnInputPage"),
        btnInputBack = document.querySelector("#btnInputBack"),
        btnDiet = document.querySelector("#btnDiet"),
        btnSchedule = document.querySelector("#btnSchedule"),
        btnDate = document.querySelector("#btnDate"),
        btnlSchdule = document.querySelector("#btnlSchedule");

    document.addEventListener("tizenhwkey", keyEventCB);

    btnDate.addEventListener("click", function() {
    	 setDate();
         console.log("dateset");
    });
    btnlSchdule.addEventListener("click", function() {
    	  getPHPString();
    	  console.log("ScheduleLoad");
    });
    
    btnInputBack.addEventListener("click", function() {
        loadDataView(db);
        changePage("pageResult");
    });
    btnSubmit.addEventListener("click", function() {
        var txtFood = document.querySelector("#txtFood"),
            txtquantity = document.querySelector("#txtquantity");

        if (!txtFood.value && !txtquantity.value) {
            showPopup("Food name and quantity data are needed.", "OK");
        } else {
            showPopup("Do you want add new data?", "OKCancel", {
                cbOK: submitNewRecord,
                cbCancel: null
            });
        }
    });

    btnInputPage.addEventListener("click", function() {
        changePage("pageInput");
    });

    btnDiet.addEventListener("click", function() {
        changePage("pageResult");
    });
    
    btnSchedule.addEventListener("click", function() {
        changePage("pageSchedule");
    });
    
    
    btnClear.addEventListener("click", function() {
        showPopup("Do you want to delete all data?", "OKCancel", {
            cbOK: function() {
                var objResultContents = document.querySelector("#resultDetail");

                emptyElement(objResultContents);
                deleteDataAll(db);
            },
            cbCancel: null
        });
    });
}

function getPHPString() {
	
	  console.log("current date 1 is "+yy + mm + dd);

    var client = new XMLHttpRequest();
    
    client.open("GET", "http://192.168.11.24/showWorkoutSchedule.php?request=show&traineeid=" + TraineeId + "&year=" +
                        + yy + "&month=" + mm + "&day=" + dd);

    client.send();
    
    function handle() {
        if(client.readyState !== 4) { // readyState 4 = load complete
            return false;
        }
        
        if(client.status === 200) { // request was successful
            alert(client.response);
        }
    }
    
    client.onreadystatechange = handle;
}

function setDate(){


	var date = new Date(document.getElementById('theDate').value);
    yy = date.getFullYear();  mm = date.getMonth()+1; dd=date.getDate();
    if(dd<10) dd='0'+dd;
    if(mm<10) mm='0'+mm;
    var dayValue = yy+'-'+mm+'-'+dd;

    document.getElementById("theDate").value = dayValue;
	
    console.log("current date is "+date.toDateString());
}

//Initialize function
var init = function() {
	setNfc();
    openDB(loadDataView);
    setDefaultSize();
    setDefaultEvents();
};

window.onload = init;
