
var sql = require('sql');
var time = require('time');
var utils = require('./js/utils.js');
var types = require('types');

var action = request.formValue('action');

var r = sql.open("sqlite3", "./js/db/test.db");
if (r.err) {
    throw r.err;
}
var db = r.value;

console.log('sqlite3.js: %j', db.stats());

var ddl = 'CREATE TABLE IF NOT EXISTS [users] ('
    + '[id] INTEGER PRIMARY KEY AUTOINCREMENT,'
    + '[firstname] TEXT,'
    + '[lastname] TEXT,'
    + '[phone] TEXT,'
    + '[email] TEXT,'
    + '[created_at] DATETIME DEFAULT CURRENT_TIMESTAMP'
    + ');';

r = db.exec(ddl);
if (!r.err) {
    var result = r.value;
    var r1 = result.lastInsertId()
    var r2 = result.rowsAffected()
    utils.log({
        lastInsertId: r1.id,
        rowsAffected: r2.rows,
    })
}
utils.log(r)

if (action === 'init') {
    r = db.exec("INSERT INTO `users` VALUES ('3', 'fname1', 'lname1', '(000)000-0000', 'name1@gmail.com', CURRENT_TIMESTAMP);");
    utils.log(r);
    r = db.exec("INSERT INTO `users` VALUES ('4', 'zengming', 'lname1', '(000)000-0000', 'zengming00@qq.com', CURRENT_TIMESTAMP);");
    utils.log(r);

} else if (action === 'get_users') {
    var page = utils.toInt(request.formValue('page'), 1);
    var page_size = utils.toInt(request.formValue('page_size'), 10);
    var offset = (page - 1) * page_size;

    var result = {
        total: 0,
        rows: [],
    }

    try {
        var data = count(db, "select count(*) from users");
        result.total = data[0];
        result.rows = query(db, "select * from users limit " + offset + "," + page_size + ";");
    } catch (e) {
        utils.log(e);
    }
    output(result);

} else if (action === 'remove_user') {
    var id = utils.toInt(request.formValue('id'), 0);

    var data = {
        lastInsertId: 0,
        rowsAffected: 0,
        success: false,
        msg: '',
    };
    var r = db.prepare("delete from users where id=?")
    if (r.err) {
        throw r.err;
    }
    var stmt = r.value;
    r = stmt.exec(id)
    if (r.err) {
        throw r.err;
    }
    var result = r.value;
    var r = result.lastInsertId()
    if (r.err) {
        throw r.err;
    }
    data.lastInsertId = r.id;
    var r = result.rowsAffected()
    if (r.err) {
        throw r.err;
    }
    data.rowsAffected = r.rows;
    data.success = true;
    output(data);

} else if (action === 'update_user') {
    var id = utils.toInt(request.formValue('id'), 0);
    var firstname = request.formValue('firstname');
    var lastname = request.formValue('lastname');
    var phone = request.formValue('phone');
    var email = request.formValue('email');

    var data = {
        lastInsertId: 0,
        rowsAffected: 0,
        success: false,
        msg: '',
    };
    var r = db.prepare("update users set firstname=?,lastname=?,phone=?,email=? where id=?");
    if (r.err) {
        throw r.err;
    }
    var stmt = r.value;
    r = stmt.exec(firstname, lastname, phone, email, id)
    if (r.err) {
        throw r.err;
    }
    var result = r.value;
    var r = result.lastInsertId()
    if (r.err) {
        throw r.err;
    }
    data.lastInsertId = r.id;
    var r = result.rowsAffected()
    if (r.err) {
        throw r.err;
    }
    data.rowsAffected = r.value;
    data.success = true;
    output(data);

} else if (action === 'save_user') {
    var firstname = request.formValue('firstname');
    var lastname = request.formValue('lastname');
    var phone = request.formValue('phone');
    var email = request.formValue('email');

    var data = {
        lastInsertId: 0,
        rowsAffected: 0,
        success: false,
        msg: '',
    };
    var r = db.prepare("insert into users(firstname,lastname,phone,email) values(?,?,?,?)")
    if (r.err) {
        throw r.err;
    }
    var stmt = r.value;
    r = stmt.exec(firstname, lastname, phone, email);
    if (r.err) {
        throw r.err;
    }
    var result = r.value;
    var r = result.lastInsertId()
    if (r.err) {
        throw r.err;
    }
    data.lastInsertId = r.id;
    var r = result.rowsAffected()
    if (r.err) {
        throw r.err;
    }
    data.rowsAffected = r.value;
    data.success = true;
    output(data);
}

db.close();

function output(data) {
    response.write(JSON.stringify(data, null, 2));
}

function count(db, msql) {
    var ret = [];
    var r = db.query(msql);
    if (r.err) {
        throw r.err;
    }
    var rows = r.value;
    while (rows.next()) {
        var n = types.newInt();
        var err = rows.scan(n)
        if (err) {
            throw err;
        }
        n = types.intValue(n);
        ret.push(n);
    }
    var err = rows.err();
    if (err) {
        throw err;
    }
    err = rows.close();
    if (err) {
        throw err;
    }
    return ret;
}

function query(db, msql) {
    var ret = [];
    var r = db.query(msql);
    if (r.err) {
        throw r.err;
    }
    var rows = r.value;
    while (rows.next()) {
        var id = types.newInt();
        var firstname = types.newString();
        var lastname = types.newString();
        var phone = types.newString();
        var email = types.newString();
        var created_at = types.newString();

        var err = rows.scan(id, firstname, lastname, phone, email, created_at);
        if (err) {
            throw err;
        }

        ret.push({
            id: types.intValue(id),
            firstname: types.stringValue(firstname),
            lastname: types.stringValue(lastname),
            phone: types.stringValue(phone),
            email: types.stringValue(email),
            created_at: types.stringValue(created_at),
        });
    }
    var err = rows.err();
    if (err) {
        throw err;
    }
    err = rows.close();
    if (err) {
        throw err;
    }
    return ret;
}