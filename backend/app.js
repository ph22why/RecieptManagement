const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const xlsx = require("xlsx");
const upload = multer({ dest: "uploads/" });

const app = express();
app.use(cors());
app.use(bodyParser.json());
// 정적 파일 서빙
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB 설정
const dbPath = path.resolve(__dirname, "./churches.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database.");
    db.run("PRAGMA foreign_keys = ON");

    db.run(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_year TEXT,
      event_name TEXT,
      is_public INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS church_event (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      church_id INTEGER,
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (church_id) REFERENCES churches(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_name TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS churches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      church_number TEXT,
      church_name TEXT,
      number_of_participants INTEGER,
      curriculum_type TEXT
    )`);
  }
});

// 동적으로 이벤트별 테이블 생성
const createEventTable = (eventName) => {
  // 테이블 존재 여부를 확인한 후, 필요한 경우 생성
  db.get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [`${eventName}_players`],
    (err, row) => {
      if (err) {
        console.error("Error checking table existence:", err);
        return;
      }
      if (row) {
        // 테이블이 이미 존재하면 바로 종료
        // console.log(`${eventName}_players 테이블 이미 존재`);
        return; // 함수 종료
      }
      if (!row) {
        db.run(
          `
          CREATE TABLE "${eventName}_players" (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            type_id INTEGER,
            player_name TEXT, 
            church_name TEXT, 
            photo_path TEXT, 
            approved INTEGER DEFAULT 0, 
            type TEXT,
            rejection_reason TEXT DEFAULT NULL,
            region TEXT
          )
        `,
          (createErr) => {
            if (createErr) {
              console.error("Error creating table:", createErr);
            } else {
              // console.log(`${eventName}_players 테이블 생성 완료`);
            }
          }
        );
      }
    }
  );
};

const getMatchingTables = (eventPrefix) => {
  return new Promise((resolve, reject) => {
    // SQLite의 시스템 테이블에서 테이블 이름을 조회
    db.all(
      `SELECT name FROM sqlite_master WHERE type='table' AND name LIKE ?`,
      [`${eventPrefix}\_%\_players`],
      (err, rows) => {
        if (err) {
          console.error("Error fetching table names:", err);
          return reject(err);
        }
        // 테이블 이름만 추출하여 반환
        const tableNames = rows.map((row) => row.name);
        resolve(tableNames);
      }
    );
  });
};

// 승인 및 반려 데이터 조회 앤드포인트
app.get("/admin/events/:table/approve-data", (req, res) => {
  const { table } = req.params; // 테이블 이름 추출

  // 테이블에서 모든 데이터 조회
  db.all(`SELECT * FROM "${table}"`, [], (err, rows) => {
    if (err) {
      // console.error("자료 신규등록 교회:", table);
      return res
        .status(500)
        .json({ message: "선수 데이터를 가져오는 중 오류가 발생했습니다." });
    }
    res.status(200).json(rows); // 데이터 반환
  });
});

// 교회별 자료 가져오기 엔드포인트
app.get("/admin/events/:event/player-data", async (req, res) => {
  const { event } = req.params; // URL에서 event 추출

  try {
    const tables = await getMatchingTables(event); // 관련 테이블 이름 조회
    const allData = [];
    for (const table of tables) {
      const rows = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM "${table}"`, [], (err, rows) => {
          if (err) {
            return reject(err);
          }
          resolve(rows);
        });
      });
      allData.push(...rows);
    }

    res.status(200).json(allData); // 모든 테이블의 데이터 반환
    // console.log(allData);
  } catch (error) {
    // console.error("Error fetching player data:", error);
    res
      .status(500)
      .json({ message: "선수 자료를 가져오는 중 오류가 발생했습니다." });
  }
});

app.post(
  "/admin/:event/upload/:type/:id",
  upload.single("photo"),
  (req, res) => {
    const { event, type, id } = req.params; // URL에서 전달된 event, type(sparks/tt)과 id 추출
    // console.log("요청 정보:", event, type, id);
    const filePath = req.file.path; // 업로드된 임시 파일 경로
    const fileExtension = path.extname(req.file.originalname); // 원본 파일 확장자 추출
    const newFilePath = `uploads/${event}_${type}_${id}${fileExtension}`; // 저장될 새로운 파일 경로

    // 요청 본문에서 데이터 추출
    const {
      player_name: playerName,
      church_name: churchName,
      region,
    } = req.body; // player_name과 church_name 추출

    // 테이블이 없으면 생성
    createEventTable(event);

    // 파일 이름 변경 및 경로 업데이트
    fs.rename(filePath, newFilePath, (err) => {
      if (err) {
        console.error("Error renaming file:", err); // 파일 이름 변경 중 에러 처리
        return res.status(500).json({ message: "파일 업로드 실패" }); // 실패 응답 반환
      }

      // 데이터베이스에 데이터 삽입 또는 업데이트
      // console.log(
      //   `쿼리 실행: SELECT * FROM "${event}_players" WHERE id = ${id} AND type = ${type}`
      // );
      // console.log(
      //   "type 데이터 유형:",
      //   typeof type,
      //   "id 데이터 유형:",
      //   typeof id
      // );
      db.get(
        `SELECT * FROM "${event}_players" WHERE type_id = ? AND type = ?`,
        [parseInt(id, 10), type.trim()],
        (err, row) => {
          if (err) {
            console.error("Error fetching max type_id:", err); // 기존 데이터 확인 중 에러 처리
            return res.status(500).json({ message: "데이터베이스 오류" });
          }

          if (row) {
            // console.log("데이터 있음", row);
            // 기존 데이터가 있는 경우 업데이트
            db.run(
              `UPDATE "${event}_players" 
               SET player_name = ?, church_name = ?, photo_path = ?, approved = 0, region = ? 
               WHERE type_id = ? AND type = ?`,
              [playerName, churchName, newFilePath, region, id, type],
              (updateErr) => {
                if (updateErr) {
                  console.error("Error updating player data:", updateErr); // 업데이트 중 에러 처리
                  return res
                    .status(500)
                    .json({ message: "데이터 업데이트 실패" });
                }
                // console.log("Player data updated successfully.");
                res
                  .status(200)
                  .json({ message: "사진 업로드 및 데이터 업데이트 성공" });
              }
            );
          } else {
            // 기존 데이터가 없으면 새로 삽입
            // console.log("기존 데이터가 없으면 새로 삽입");
            // 새로운 type_id 생성
            db.get(
              `SELECT MAX(type_id) as maxTypeId FROM "${event}_players" WHERE type = ?`,
              [type.trim()],
              (maxErr, maxRow) => {
                if (maxErr) {
                  console.error("Error fetching max type_id:", maxErr); // 최대 type_id 확인 중 에러 처리
                  return res.status(500).json({ message: "데이터베이스 오류" });
                }
                const typeId = (maxRow?.maxTypeId || 0) + 1; // 새로운 type_id 계산
                // 데이터 삽입
                db.run(
                  `INSERT INTO "${event}_players" 
                  (type_id, player_name, church_name, photo_path, approved, type, region) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    typeId,
                    playerName,
                    churchName,
                    newFilePath,
                    0,
                    type,
                    region,
                  ],
                  (insertErr) => {
                    if (insertErr) {
                      console.error("Error inserting player data:", insertErr); // 삽입 중 에러 처리
                      return res
                        .status(500)
                        .json({ message: "데이터 삽입 실패" });
                    }
                    // console.log("Player data inserted successfully.");
                    res
                      .status(200)
                      .json({ message: "사진 업로드 및 데이터 삽입 성공" });
                  }
                );
              }
            );
          }
        }
      );
    });
  }
);

// 승인 상태 변경 엔드포인트(승인)
app.post("/admin/approve", (req, res) => {
  const { photo_path, church_name, player_name } = req.body;

  if (!photo_path) {
    console.error("photo_path is undefined or empty");
    return res.status(400).json({ message: "Invalid photo_path provided" });
  }

  try {
    const fileName = path.basename(photo_path);
    const fileNameWithoutExt = fileName.split(".").slice(0, -1).join(".");
    const parts = fileNameWithoutExt.split("_");
    if (parts.length < 5) {
      throw new Error("Invalid photo_path format: not enough parts");
    }

    const eventPart = parts.slice(0, 4).join("_");
    const type = parts[4];
    const id = parts[5];
    const tableName = `${eventPart}_players`;

    if (!type || !id || isNaN(id)) {
      throw new Error("Invalid type or id in photo_path");
    }

    const newFileName = `${church_name}_${player_name}${path.extname(
      photo_path
    )}`;
    const filePath = path.join(__dirname, photo_path);

    // 파일 다운로드
    res.download(filePath, newFileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        return res.status(500).json({ message: "파일 다운로드 실패" });
      }

      // 파일 삭제 및 승인 상태 업데이트
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting file:", unlinkErr);
          return; // 파일 삭제 실패 시 추가 처리는 생략
        }

        // 승인 상태 업데이트
        db.run(
          `UPDATE "${tableName}" SET approved = 1, photo_path = NULL WHERE type_id = ? AND type = ?`,
          [id, type],
          (updateErr) => {
            if (updateErr) {
              console.error("Error updating approval status:", updateErr);
            } else {
              // console.log("Approval status updated successfully.");
            }
          }
        );
      });
    });
  } catch (error) {
    console.error("Error processing photo_path:", error.message);
    res
      .status(400)
      .json({ message: `Invalid photo_path format: ${error.message}` });
  }
});

// 승인 상태 변경 엔드포인트(반려)
app.post("/admin/reject", (req, res) => {
  const { id, rejection_reason, photo_path } = req.body;

  if (!photo_path) {
    console.error("photo_path is undefined or empty");
    return res.status(400).json({ message: "Invalid photo_path provided" });
  }

  try {
    // 파일명 파싱
    const fileName = path.basename(photo_path);
    const fileNameWithoutExt = fileName.split(".").slice(0, -1).join(".");
    const parts = fileNameWithoutExt.split("_");

    if (parts.length < 5) {
      throw new Error("Invalid photo_path format: not enough parts");
    }

    const eventPart = parts.slice(0, 4).join("_"); // 코드, 연도, 등록번호3자리, 8자리번호
    const type = parts[4]; // type 추출
    const tableName = `${eventPart}_players`; // 테이블 이름 생성

    // console.log("Generated tableName:", tableName);
    // console.log("Extracted type:", type);

    // 반려 사유 업데이트
    db.run(
      `UPDATE "${tableName}" SET rejection_reason = ?, approved = 0 WHERE type_id = ? AND type = ?`,
      [rejection_reason, id, type],
      function (err) {
        if (err) {
          console.error("Error updating rejection reason:", err);
          return res.status(500).json({ message: "반려 처리 실패" });
        }
        res.status(200).json({ message: "반려 처리 성공" });
      }
    );
  } catch (error) {
    console.error("Error processing photo_path:", error.message);
    res
      .status(400)
      .json({ message: `Invalid photo_path format: ${error.message}` });
  }
});

// 선수 목록 조회 엔드포인트
app.get("/admin/:event/check", (req, res) => {
  const { event } = req.params; // URL에서 event 추출

  // 데이터베이스에서 이벤트별 선수 데이터 조회
  db.all(
    `SELECT id, player_name AS playerName, church_name AS churchName, approved, type FROM "${event}_players"`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching data:", err); // 데이터 조회 중 에러 처리
        return res.status(500).json({ message: "데이터 조회 실패" });
      }

      // type별로 선수 데이터 분리
      const sparksList = rows.filter((row) => row.type === "sparks"); // Sparks 데이터 필터링
      const ttList = rows.filter((row) => row.type === "tt"); // T&T 데이터 필터링

      res.status(200).json({ sparksList, ttList }); // JSON 형식으로 응답 반환
    }
  );
});

app.post("/admin/receipts/export", async (req, res) => {
  try {
    const { event_year, event_name } = req.body;
    const tableNamePattern = `${event_name}_${event_year}%`;

    // 테이블 이름 조회
    const tablesQuery = `
      SELECT name
      FROM sqlite_master
      WHERE type='table' AND name LIKE ?;
    `;

    const tables = await new Promise((resolve, reject) => {
      db.all(tablesQuery, [tableNamePattern], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 테이블 이름 확인
    if (!tables.length) {
      console.log("No matching tables found.");
      return res
        .status(404)
        .json({ message: "조회 가능한 데이터 테이블이 없습니다." });
    }

    // console.log("Fetched tables:", tables);

    // 테이블별 매핑 데이터
    const mappedData = [];
    const requiredColumns = [
      { name: "totalcosts", type: "INTEGER", default: 0 },
      { name: "representative", type: "TEXT", default: null },
      { name: "contact", type: "TEXT", default: null },
      { name: "church_name", type: "TEXT", default: null },
    ];

    for (const table of tables) {
      const tableName = table.name;

      // 1. 컬럼 존재 여부 확인
      const columnInfoQuery = `PRAGMA table_info(${tableName});`;

      const columns = await new Promise((resolve, reject) => {
        db.all(columnInfoQuery, [], (err, rows) => {
          if (err) {
            console.error(
              `Error fetching columns from ${tableName}:`,
              err.message
            );
            reject(err);
            return;
          }
          resolve(rows);
        });
      });

      // 필요한 컬럼이 없으면 추가
      for (const { name, type, default: defaultValue } of requiredColumns) {
        const hasColumn = columns.some((col) => col.name === name);

        if (!hasColumn) {
          const addColumnQuery = `ALTER TABLE ${tableName} ADD COLUMN ${name} ${type} DEFAULT ${defaultValue};`;
          await new Promise((resolve, reject) => {
            db.run(addColumnQuery, [], (err) => {
              if (err) {
                console.error(
                  `Error adding column '${name}' to ${tableName}:`,
                  err.message
                );
                reject(err);
                return;
              }
              // console.log(`Added '${name}' column to ${tableName}`);
              resolve();
            });
          });
        }
      }

      // 2. 기본 정보 조회
      const tableDataQuery = `
        SELECT church_name, representative, contact, totalcosts
        FROM '${tableName}'
        WHERE id='1000';
      `;

      const basicInfo = await new Promise((resolve, reject) => {
        db.get(tableDataQuery, [], (err, row) => {
          if (err) {
            console.error(
              `Error fetching data from ${tableName}:`,
              err.message
            );
            reject(err);
            return;
          }
          resolve(row || {});
        });
      });

      // 3. CHURCHNUMBER 매핑
      const churchNumberMatch = tableName.split("_")[2] || "N/A";

      // 4. 매핑된 데이터 추가
      mappedData.push({
        CHURCHNUMBER: churchNumberMatch, // 테이블 이름에서 추출한 3번째 숫자
        CHURCHNAME: basicInfo.church_name || "N/A",
        LEADERNAME: basicInfo.representative || "N/A",
        LEADERPHONE: basicInfo.contact || "N/A",
        COST: basicInfo.totalcosts || 0,
      });
    }

    // 매핑된 데이터 반환
    // console.log("Mapped Data:", mappedData);
    res.status(200).json(mappedData);
  } catch (error) {
    console.error("Error handling request:", error.message);
    res
      .status(500)
      .json({ message: "An error occurred while processing the request." });
  }
});

app.get("/admin/events/:eventName/registration-data", async (req, res) => {
  const { eventName } = req.params;
  const { year } = req.query;

  if (!eventName || !year) {
    return res.status(400).json({ error: "이벤트 이름과 연도가 필요합니다." });
  }

  try {
    const tableNamePattern = `${eventName}_${year}_%`;

    const checkTableSQL = `
      SELECT name
      FROM sqlite_master
      WHERE type='table' AND name LIKE ?;
    `;

    const tables = await new Promise((resolve, reject) => {
      db.all(checkTableSQL, [`${tableNamePattern}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (tables.length === 0) {
      return res
        .status(404)
        .json({ message: "조회 가능한 데이터 테이블이 없습니다." });
    }

    let sparksAndTTData = [];
    let basicInfoMap = {};

    for (const table of tables) {
      const tableName = table.name;

      // 테이블 이름에서 등록번호 추출
      const churchNumber = tableName.split("_")[2] || "N/A";

      const dataQuery = `SELECT * FROM ${tableName};`;
      const tableData = await new Promise((resolve, reject) => {
        db.all(dataQuery, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // basicInfo 데이터를 맵으로 저장
      tableData
        .filter((row) => row.category === "basicInfo")
        .forEach((info) => {
          basicInfoMap[info.church_name] = {
            region: info.region || "정보 없음",
            representative: info.representative || null,
            contact: info.contact || null,
            totalcosts: info.totalcosts || null,
            churchNumber, // 등록번호 추가
          };
        });

      // Sparks와 T&T 데이터 필터링
      sparksAndTTData = sparksAndTTData.concat(
        tableData.filter((row) => ["Sparks", "T&T"].includes(row.category))
      );
    }

    // Sparks와 T&T 데이터에 참가지역 및 등록번호 추가
    const enrichedData = sparksAndTTData.map((row) => ({
      region: basicInfoMap[row.church_name]?.region || "정보 없음",
      handbook: row.handbook,
      church_name: row.church_name,
      player_name: row.player_name,
      coach_name: row.coach_name,
      coach_contact: row.coach_contact,
      church_number: basicInfoMap[row.church_name]?.churchNumber || "N/A", // 등록번호 추가
    }));

    res.status(200).json(enrichedData);
  } catch (error) {
    console.error("데이터 조회 중 오류 발생:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// 등록 관련 함수
// 테이블 존재 여부 확인 및 생성 함수
const ensureTableExists = async (tableName) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER NOT NULL,
      region TEXT,
      church_number TEXT,
      church_name TEXT,
      representative TEXT,
      contact TEXT,
      totalcosts INTEGER DEFAULT 0,
      category TEXT,
      handbook TEXT,
      player_name TEXT,
      coach_name TEXT,
      coach_contact TEXT,
      observer_name TEXT UNIQUE,
      observer_count INTEGER DEFAULT 0,
      has_meal INTEGER DEFAULT 0,
      has_pin INTEGER DEFAULT 0,
      PRIMARY KEY (id, category)
    )
  `;

  // 테이블 생성
  await new Promise((resolve, reject) => {
    db.run(createTableQuery, (err) => {
      if (err) {
        console.error(`Error creating table ${tableName}:`, err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  // 필요한 컬럼 확인 및 추가
  const requiredColumns = [
    { name: "region", type: "TEXT" },
    { name: "representative", type: "TEXT" },
    { name: "church_number", type: "TEXT" },
    { name: "contact", type: "TEXT" },
    { name: "category", type: "TEXT" },
    { name: "handbook", type: "TEXT" },
    { name: "totalcosts", type: "INTEGER DEFAULT 0" },
  ];

  for (const { name, type } of requiredColumns) {
    await new Promise((resolve, reject) => {
      const alterQuery = `ALTER TABLE ${tableName} ADD COLUMN ${name} ${type}`;
      db.run(alterQuery, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
          console.error(
            `Error adding column "${name}" to table "${tableName}":`,
            err.message
          );
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

// 기존 데이터 가져오기 함수
const fetchTableData = (tableName) => {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM ${tableName}`;
    db.all(selectQuery, (err, rows) => {
      if (err) {
        if (err.message.includes("no such table")) {
          console.log(`Table "${tableName}" does not exist.`);
          resolve([]);
        } else {
          console.error(`Error fetching data from ${tableName}:`, err.message);
          reject(err);
        }
      } else {
        resolve(rows);
      }
    });
  });
};

// 분리 로직
const processFetchedData = (rows) => {
  const basicInfoRow = rows.find((row) => row.category === "basicInfo");
  const basicInfo = basicInfoRow
    ? {
        id: basicInfoRow.id,
        region: basicInfoRow.region || "",
        church_number: basicInfoRow.church_number || "",
        church_name: basicInfoRow.church_name || "",
        representative: basicInfoRow.representative || "",
        contact: basicInfoRow.contact || "",
      }
    : null;
  const sparksList = rows.filter((row) => row.category === "Sparks");
  const ttList = rows.filter((row) => row.category === "T&T");
  const observers = rows.filter((row) => row.category === "Observer");
  // console.log("Filtered basicInfoRow:", basicInfoRow);
  // console.log("Filtered Sparks:", sparksList);
  // console.log("Filtered T&T:", ttList);
  // console.log("Filtered Observers:", observers);

  return { basicInfo, sparksList, ttList, observers };
};

// 데이터 삽입 또는 업데이트 함수
const insertOrUpdateTableData = (tableName, values) => {
  return new Promise((resolve, reject) => {
    // SELECT 쿼리로 id와 category 조합 확인
    const selectQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE id = ? AND category = ?`;

    // INSERT 쿼리
    const insertQuery = `
      INSERT INTO ${tableName} (
        id, region, church_number, church_name, representative, contact, totalcosts, category,
        handbook, player_name, coach_name, coach_contact,
        observer_name, observer_count, has_meal, has_pin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // UPDATE 쿼리
    const updateQuery = `
      UPDATE ${tableName}
      SET
        region = COALESCE(?, region),
        church_number = COALESCE(?, church_number),
        church_name = COALESCE(?, church_name),
        representative = COALESCE(?, representative),
        contact = COALESCE(?, contact),
        totalcosts = COALESCE(?, totalcosts),
        category = COALESCE(?, category),
        handbook = COALESCE(?, handbook),
        player_name = COALESCE(?, player_name),
        coach_name = COALESCE(?, coach_name),
        coach_contact = COALESCE(?, coach_contact),
        observer_name = COALESCE(?, observer_name),
        observer_count = COALESCE(?, observer_count),
        has_meal = COALESCE(?, has_meal),
        has_pin = COALESCE(?, has_pin)
      WHERE id = ? AND category = ?
    `;

    const isObserver = values.category === "Observer";
    const isBasicInfo = values.category === "basicInfo";

    const insertValues = isObserver
      ? [
          values.id || null,
          values.region || null, // region
          values.church_number || null, // church_number
          values.church_name || null, // church_name
          null, // representative
          null, // contact
          null, // totalcosts
          "Observer",
          null, // handbook
          null, // player_name
          null, // coach_name
          null, // coach_contact
          values.observer_name || null,
          values.observer_count || 0,
          values.has_meal ? 1 : 0,
          values.has_pin ? 1 : 0,
        ]
      : isBasicInfo
      ? [
          values.id || 1000,
          values.region || null, // region
          values.church_number || null, // church_number
          values.church_name || null, // church_name
          values.representative || null, // representative
          values.contact || null, // contact
          values.totalcosts ?? 0,
          "basicInfo", // category 지정
          null, // handbook
          null, // player_name
          null, // coach_name
          null, // coach_contact
          null, // observer_name
          null, // observer_count
          null, // has_meal
          null, // has_pin
        ]
      : [
          values.id || null,
          values.region || null,
          values.church_number || null,
          values.church_name || null,
          values.representative || null,
          values.contact || null,
          null, // totalcosts
          values.category || null, // Sparks or T&T
          values.handbook || null,
          values.player_name || null,
          values.coach_name || null,
          values.coach_contact || null,
          null, // observer_name
          null, // observer_count
          values.has_meal ? 1 : 0,
          values.has_pin ? 1 : 0,
        ];

    const updateValues = [
      values.region || null,
      values.church_number || null,
      values.church_name || null,
      values.representative || null,
      values.contact || null,
      values.totalcosts ?? 0,
      values.category || null,
      values.handbook || null,
      values.player_name || null,
      values.coach_name || null,
      values.coach_contact || null,
      values.observer_name || null,
      values.observer_count || null,
      values.has_meal ? 1 : 0,
      values.has_pin ? 1 : 0,
      values.id || null,
      values.category, // WHERE 조건용
    ];

    // SELECT 쿼리 실행
    db.get(selectQuery, [values.id, values.category], (err, row) => {
      if (err) {
        console.error(`Error checking data in ${tableName}:`, err.message);
        return reject(err);
      }

      const exists = row.count > 0;

      if (exists) {
        // 데이터가 이미 존재하면 업데이트
        db.run(updateQuery, updateValues, function (updateErr) {
          if (updateErr) {
            console.error(
              `Error updating data in ${tableName}:`,
              updateErr.message
            );
            return reject(updateErr);
          }
          resolve();
        });
      } else {
        // 데이터가 없으면 삽입
        db.run(insertQuery, insertValues, function (insertErr) {
          if (insertErr) {
            console.error(
              `Error inserting data into ${tableName}:`,
              insertErr.message
            );
            return reject(insertErr);
          }
          resolve();
        });
      }
    });
  });
};

// API endpoints
// POST API: 데이터 저장
app.post("/submit-registration/:tableName", async (req, res) => {
  const { tableName } = req.params;
  const { basicInfo, sparksParticipants, ttParticipants, observers } = req.body;

  try {
    await ensureTableExists(tableName);

    const saveBasicInfo = async (basicInfo) => {
      const values = {
        id: 1000 || null,
        region: basicInfo.region || null,
        church_number: basicInfo.church_number || null,
        church_name: basicInfo.church_name || null,
        representative: basicInfo.representative || null,
        contact: basicInfo.contact || null,
        totalcosts: basicInfo.totalcosts ?? null,
        category: "basicInfo",
      };
      // console.log(`Saving basicInfo participant:`, values);
      await insertOrUpdateTableData(tableName, values);
    };

    const saveParticipants = async (participants, category) => {
      for (const participant of participants) {
        const values = {
          id: participant.id || null,
          region: null,
          church_number: null,
          church_name: participant.churchName || null,
          representative: participant.representative || null,
          contact: participant.contact || null,
          category, // 명시적으로 카테고리 지정
          handbook: participant.handbook || null,
          player_name: participant.playerName || null,
          coach_name: participant.coachName || null,
          coach_contact: participant.coachContact || null,
          observer_name: null,
          observer_count: null,
          has_meal: 0,
          has_pin: 0,
        };
        // console.log(`Saving ${category} participant:`, values); // 디버깅 로그
        await insertOrUpdateTableData(tableName, values);
      }
    };

    // 카테고리별로 처리
    await saveBasicInfo(basicInfo);
    await saveParticipants(sparksParticipants, "Sparks");
    await saveParticipants(ttParticipants, "T&T");

    for (const observer of observers) {
      const values = {
        id: observer.id || null,
        category: "Observer",
        observer_name: observer.observerName || null,
        observer_count: observer.observerCount || 0,
        has_meal: observer.hasMeal ? 1 : 0,
        has_pin: observer.hasPin ? 1 : 0,
      };
      // console.log("Saving Observer:", values); // 디버깅 로그
      await insertOrUpdateTableData(tableName, values);
    }

    res.status(201).json({ message: "Registration data saved successfully!" });
  } catch (err) {
    console.error("Error saving registration data:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// POST /register/check-table
app.post("/register/check-table", (req, res) => {
  const { tableName } = req.body;

  if (!tableName) {
    return res.status(400).json({ error: "Table name is required" });
  }

  const createTableSQL = `
  CREATE TABLE IF NOT EXISTS ${tableName} (
    id INTEGER NOT NULL,
    category TEXT NOT NULL,
    handbook TEXT,
    church_name TEXT,
    player_name TEXT,
    coach_name TEXT,
    coach_contact TEXT,
    observer_name TEXT,
    observer_count INTEGER DEFAULT 0,
    has_meal INTEGER DEFAULT 0,
    has_pin INTEGER DEFAULT 0,
    PRIMARY KEY (id, category)
  )
`;

  const checkTableSQL = `
    SELECT name FROM sqlite_master WHERE type='table' AND name=?;
  `;

  db.get(checkTableSQL, [tableName], (err, row) => {
    if (err) {
      console.error("Error checking table existence:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (row) {
      // 테이블이 이미 존재하는 경우
      return res.json({ status: "table_exists" });
    }

    // 테이블이 없으므로 새로 생성
    db.run(createTableSQL, (err) => {
      if (err) {
        console.error("Error creating table:", err);
        return res.status(500).json({ error: "Error creating table" });
      }

      return res.json({ status: "table_created" });
    });
  });
});

app.get("/register/:tableName", async (req, res) => {
  const { tableName } = req.params;

  try {
    const rows = await fetchTableData(tableName); // 모든 데이터 조회
    const { basicInfo, sparksList, ttList, observers } =
      processFetchedData(rows); // 분리 로직 호출

    res.status(200).json({ basicInfo, sparksList, ttList, observers });
  } catch (err) {
    console.error("Error fetching registration data:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 삭제처리
app.delete("/delete-participant/:tableName/:id", (req, res) => {
  const { tableName, id } = req.params;

  const deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;

  db.run(deleteQuery, [id], function (err) {
    if (err) {
      console.error(
        `Error deleting participant from ${tableName}:`,
        err.message
      );
      return res.status(500).json({ error: "Failed to delete participant." });
    }

    res.status(200).json({ message: "Participant deleted successfully." });
  });
});

// 이벤트 목록 가져오기
app.get("/admin/events", (req, res) => {
  db.all("SELECT * FROM events", (err, rows) => {
    if (err) {
      console.error("Error fetching events:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(rows);
  });
});

// 공개된 이벤트 목록 가져오기
app.get("/events", (req, res) => {
  db.all("SELECT * FROM events WHERE is_public = 1", (err, rows) => {
    if (err) {
      console.error("Error fetching public events:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(rows);
  });
});

// 새로운 이벤트 추가
app.post("/admin/events", (req, res) => {
  const { event_year, event_name, is_public = 0 } = req.body;
  if (!event_year || !event_name) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const query = `INSERT INTO events (event_year, event_name, is_public) VALUES (?, ?, ?)`;
  db.run(query, [event_year, event_name, is_public], function (err) {
    if (err) {
      console.error("Error adding new event:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res
      .status(201)
      .json({ message: "Event added successfully", id: this.lastID });
  });
});

// 이벤트 공개 여부 설정
app.put("/admin/events/:id/public", (req, res) => {
  const { id } = req.params;
  const { is_public } = req.body;
  const query = `UPDATE events SET is_public = ? WHERE id = ?`;

  db.run(query, [is_public, id], function (err) {
    if (err) {
      console.error(`Error updating event ${id}:`, err);
      return res.status(500).json({ error: "Server error" });
    }
    res.status(200).json({ message: "Event updated successfully" });
  });
});

// 이벤트 수정 API
app.put("/admin/events/:id", (req, res) => {
  const { id } = req.params;
  const { event_name, event_year } = req.body;

  if (!event_name || !event_year) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const query = `UPDATE events SET event_name = ?, event_year = ? WHERE id = ?`;
  db.run(query, [event_name, event_year, id], function (err) {
    if (err) {
      console.error(`Error updating event with ID ${id}:`, err);
      return res.status(500).json({ error: "Server error" });
    }
    res.status(200).json({ message: "Event updated successfully" });
  });
});

// 이벤트 삭제
app.delete("/admin/events/:id", (req, res) => {
  const eventId = req.params.id;
  const query = "DELETE FROM events WHERE id = ?";

  db.run(query, [eventId], function (err) {
    if (err) {
      console.error(`Error deleting event ${eventId}:`, err);
      return res.status(500).json({ error: "Server error" });
    }
    res.status(200).json({ message: "Event deleted successfully" });
  });
});

// 교회 목록 가져오기
app.get("/admin/churches", (req, res) => {
  db.all("SELECT * FROM churches", (err, rows) => {
    if (err) {
      console.error("Error fetching churches:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(rows);
  });
});

// 교회 정보 수정
app.put("/admin/churches/:id", (req, res) => {
  const { id } = req.params;
  const {
    church_number,
    church_name,
    number_of_participants,
    curriculum_type,
  } = req.body;

  const query = `
    UPDATE churches 
    SET church_number = ?, church_name = ?, number_of_participants = ?, curriculum_type = ?
    WHERE id = ?
  `;
  db.run(
    query,
    [church_number, church_name, number_of_participants, curriculum_type, id],
    function (err) {
      if (err) {
        console.error(`Error updating church with ID ${id}:`, err);
        return res.status(500).json({ error: "Server error" });
      }
      res.status(200).json({ message: "Church updated successfully" });
    }
  );
});

// 새로운 교회 추가
app.post("/admin/churches", (req, res) => {
  const {
    church_number,
    church_name,
    number_of_participants,
    curriculum_type,
  } = req.body;

  const query = `
    INSERT INTO churches (church_number, church_name, number_of_participants, curriculum_type)
    VALUES (?, ?, ?, ?)
  `;
  db.run(
    query,
    [church_number, church_name, number_of_participants, curriculum_type],
    function (err) {
      if (err) {
        console.error("Error adding new church:", err);
        return res.status(500).json({ error: "Server error" });
      }
      res.status(201).json({ message: "Church added successfully" });
    }
  );
});

// 교회 삭제
app.delete("/admin/churches/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM churches WHERE id = ?";
  db.run(query, [id], function (err) {
    if (err) {
      console.error(`Error deleting church with ID ${id}:`, err);
      return res.status(500).json({ error: "Server error" });
    }
    res.status(200).json({ message: "Church deleted successfully" });
  });
});

// 엑셀 파일 업로드 및 동적 테이블 생성 API
app.post("/admin/uploadExcel", upload.single("file"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const columns = jsonData[0];
  const rows = jsonData.slice(1);

  const tableName = `${req.body.event_name}_${req.body.event_year}`
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();

  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ${columns
              .map((col) => `${col.replace(/[^\w]/g, "_")} TEXT`)
              .join(", ")}
        )
    `;

  db.run(createTableQuery, (err) => {
    if (err) {
      console.error("Error creating table:", err);
      return res.status(500).send("Error creating table.");
    }

    const insertQuery = `
            INSERT INTO ${tableName} (${columns
      .map((col) => col.replace(/[^\w]/g, "_"))
      .join(", ")})
            VALUES (${columns.map(() => "?").join(", ")})
        `;

    rows.forEach((row) => {
      db.run(insertQuery, row, (err) => {
        if (err) {
          console.error("Error inserting row:", err);
        }
      });
    });

    res.send("File uploaded and table created successfully");
  });
});

// 새로운 행 추가 API
app.post("/admin/events/:eventId/data", (req, res) => {
  const { eventId } = req.params;
  const newRow = req.body; // 프론트엔드에서 전달된 새 행 데이터

  // 이벤트 정보를 먼저 가져와야 테이블 이름을 생성할 수 있음
  const eventQuery = `SELECT event_name, event_year FROM events WHERE id = ?`;

  db.get(eventQuery, [eventId], (err, event) => {
    if (err) {
      console.error("Error fetching event details:", err);
      return res.status(500).json({ error: "Failed to fetch event details" });
    }

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // 테이블 이름은 이벤트 이름과 연도로 결정됨
    const tableName = `${event.event_name}_${event.event_year}`
      .replace(/\s+/g, "_") // 공백을 밑줄로 변환
      .replace(/[^a-zA-Z0-9_]/g, "") // 특수문자 제거
      .replace(/_+/g, "_") // 연속된 밑줄을 하나로 변환
      .replace(/^_|_$/g, "") // 앞뒤에 붙은 밑줄 제거
      .toLowerCase(); // 소문자로 변환

    // 컬럼명 추출 (newRow에 있는 키를 기반으로)
    const columns = Object.keys(newRow)
      .map((key) => key.replace(/[^\w]/g, "_"))
      .join(", ");

    // 값을 삽입하는 쿼리 생성
    const values = Object.values(newRow)
      .map(() => "?")
      .join(", ");

    const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;

    db.run(insertQuery, Object.values(newRow), function (err) {
      if (err) {
        console.error("Error adding new row:", err);
        return res.status(500).json({ error: "Failed to add new row" });
      }
      res.status(201).json({ message: "New row added successfully" });
    });
  });
});

// 데이터 삭제 API
app.delete("/admin/events/:eventId/data/:rowId", (req, res) => {
  const { eventId, rowId } = req.params;

  // 이벤트 정보를 먼저 가져와야 테이블 이름을 생성할 수 있음
  const eventQuery = `SELECT event_name, event_year FROM events WHERE id = ?`;

  db.get(eventQuery, [eventId], (err, event) => {
    if (err) {
      console.error("Error fetching event details:", err);
      return res.status(500).json({ error: "Failed to fetch event details" });
    }

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // 테이블 이름은 이벤트 이름과 연도로 결정됨
    const tableName = `${event.event_name}_${event.event_year}`
      .replace(/\s+/g, "_") // 공백을 밑줄로 변환
      .replace(/[^a-zA-Z0-9_]/g, "") // 특수문자 제거
      .replace(/_+/g, "_") // 연속된 밑줄을 하나로 변환
      .replace(/^_|_$/g, "") // 앞뒤에 붙은 밑줄 제거
      .toLowerCase(); // 소문자로 변환

    // 데이터 삭제 쿼리 실행
    const deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;

    db.run(deleteQuery, [rowId], function (err) {
      if (err) {
        console.error(`Error deleting row with ID ${rowId}:`, err);
        return res.status(500).json({ error: "Failed to delete row" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Row not found" });
      }

      res.status(200).json({ message: "Row deleted successfully" });
    });
  });
});

// 특정 이벤트의 데이터를 가져오는 API (컬럼명 포함)
app.get("/admin/events/:eventId/data", (req, res) => {
  const { eventId } = req.params;

  // 이벤트 정보 가져와 테이블 이름 생성
  const query = "SELECT event_name, event_year FROM events WHERE id = ?";
  db.get(query, [eventId], (err, event) => {
    if (err) {
      console.error(`Error fetching event info for ID ${eventId}:`, err);
      return res.status(500).json({ error: "Server error" });
    }
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // 테이블 이름 형식 설정 (이벤트 이름과 연도 사용)
    const tableName = `${event.event_name}_${event.event_year}`
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    // 해당 이벤트 데이터 조회
    const dataQuery = `SELECT * FROM ${tableName}`;
    db.all(dataQuery, (err, rows) => {
      if (err) {
        console.error(`Error fetching data for table ${tableName}:`, err);
        return res.status(500).json({ error: "Error fetching event data" });
      }
      res.json(rows); // 조회된 데이터 반환
    });
  });
});

// 이벤트 초기화
// 특정 이벤트의 데이터를 초기화하는 API
app.delete("/admin/events/:eventId/reset-data", async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    return res.status(400).json({ error: "이벤트 ID가 필요합니다." });
  }

  try {
    // 이벤트 정보 가져오기
    const query = "SELECT event_name, event_year FROM events WHERE id = ?";
    const event = await new Promise((resolve, reject) => {
      db.get(query, [eventId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!event) {
      return res.status(404).json({ error: "해당 이벤트를 찾을 수 없습니다." });
    }

    // 테이블 이름 생성
    const tableName = `${event.event_name}_${event.event_year}`
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    // 해당 이벤트 데이터 초기화
    const resetQuery = `DELETE FROM ${tableName}`;
    await new Promise((resolve, reject) => {
      db.run(resetQuery, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(
      `Data for event ${event.event_name} (${event.event_year}) has been reset.`
    );
    res.status(200).json({ message: "이벤트 데이터가 초기화되었습니다." });
  } catch (error) {
    console.error("Error resetting event data:", error.message);
    res.status(500).json({ error: "데이터 초기화 중 오류가 발생했습니다." });
  }
});

// 데이터 수정 API (특정 이벤트의 특정 데이터 수정)
app.put("/admin/events/:eventId/data/:dataId", (req, res) => {
  const { eventId, dataId } = req.params;
  const { event_name, event_year, ...updatedData } = req.body; // 이벤트 이름과 연도를 분리하고 나머지 데이터는 수정할 내용

  if (!event_name || !event_year) {
    return res.status(400).json({ error: "Invalid event name or year" });
  }

  // 테이블 이름 생성 (이벤트의 이름과 연도를 사용하여 테이블 명 생성)
  const tableName = `${event_name}_${event_year}`
    .replace(/\s+/g, "_") // 공백을 밑줄로 변환
    .replace(/[^a-zA-Z0-9_]/g, "") // 특수문자 제거
    .replace(/_+/g, "_") // 연속된 밑줄을 하나로 변환
    .replace(/^_|_$/g, "") // 앞뒤에 붙은 밑줄 제거
    .toLowerCase(); // 소문자로 변환

  // 수정할 컬럼과 값을 추출하여 동적으로 쿼리를 생성
  const columns = Object.keys(updatedData)
    .map((col) => `${col.replace(/[^\w]/g, "_")} = ?`)
    .join(", ");
  const values = Object.values(updatedData);

  const query = `UPDATE ${tableName} SET ${columns} WHERE id = ?`;

  // 데이터 수정
  db.run(query, [...values, dataId], function (err) {
    if (err) {
      console.error(`Error updating data with ID ${dataId}:`, err);
      return res.status(500).json({ error: "Server error" });
    }

    res.status(200).json({ message: "Data updated successfully" });
  });
});

// 특정 이벤트 데이터 수정 (업데이트)
app.put("/admin/events/:eventId/data/:rowId", (req, res) => {
  const { eventId, rowId } = req.params; // eventId와 rowId를 가져옴
  const updatedData = req.body; // 클라이언트로부터 수정된 데이터

  // 이벤트 정보를 데이터베이스에서 가져와 테이블 이름을 설정
  db.get(
    "SELECT event_year, event_name FROM events WHERE id = ?",
    [eventId],
    (err, eventRow) => {
      if (err) {
        console.error("Error fetching event information:", err);
        return res
          .status(500)
          .json({ error: "Error fetching event information" });
      }

      if (!eventRow) {
        return res.status(404).json({ error: "Event not found" });
      }

      // event_year와 event_name 기반으로 테이블 이름 생성
      const tableName = `${eventRow.event_year}_${eventRow.event_name}`
        .replace(/\s+/g, "_") // 공백을 밑줄로 변환
        .replace(/[^a-zA-Z0-9_]/g, "") // 특수문자 제거
        .replace(/_+/g, "_") // 연속된 밑줄을 하나로 변환
        .replace(/^_|_$/g, "") // 앞뒤에 붙은 밑줄 제거
        .toLowerCase();

      // SQL 쿼리 및 데이터 업데이트 처리
      const columns = Object.keys(updatedData); // 수정할 컬럼 추출
      const values = Object.values(updatedData); // 수정된 값 추출

      // SQL 업데이트 쿼리 생성
      const query = `
      UPDATE ${tableName}
      SET ${columns.map((col) => `${col} = ?`).join(", ")}
      WHERE id = ?
    `;

      db.run(query, [...values, rowId], function (err) {
        if (err) {
          console.error(`Error updating data with ID ${rowId}:`, err);
          return res.status(500).json({ error: "Server error" });
        }

        res.status(200).json({ message: "Data updated successfully" });
      });
    }
  );
});

// 업로드된 테이블 목록 조회
app.get("/admin/tables", (req, res) => {
  const query = `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;

  db.all(query, (err, rows) => {
    if (err) {
      console.error("Error fetching table list:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(rows.map((row) => row.name));
  });
});

// 공개된 이벤트 리스트에서 교회 데이터를 검색하는 API
app.get("/public/events/search", (req, res) => {
  const { churchNumber, churchName } = req.query;

  // 공개된 이벤트에서만 검색하도록 is_public이 1인 이벤트 찾기
  db.all(
    "SELECT event_year, event_name FROM events WHERE is_public = 1",
    [],
    (err, events) => {
      if (err) {
        console.error("Error fetching public events:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (events.length === 0) {
        return res.status(404).json({ message: "No public events found" });
      }

      // 각 공개된 이벤트 테이블에서 교회 데이터를 검색
      const promises = events.map((event) => {
        // 테이블 이름을 이벤트 이름과 년도 순으로 생성
        const tableName = `${event.event_name}_${event.event_year}`
          .replace(/\s+/g, "_") // 공백을 밑줄로 변환
          .replace(/[^a-zA-Z0-9_]/g, "") // 특수문자 제거
          .replace(/_+/g, "_") // 연속된 밑줄 제거
          .replace(/^_|_$/g, "") // 앞뒤의 밑줄 제거
          .toLowerCase(); // 소문자로 변환

        // 테이블 이름을 백틱으로 감싸서 사용하고 컬럼명을 올바르게 수정
        const query = `
        SELECT * FROM \`${tableName}\`
        WHERE CHURCHNUMBER = ? OR CHURCHNAME LIKE ?
      `;

        return new Promise((resolve, reject) => {
          db.all(query, [churchNumber, `%${churchName}%`], (err, rows) => {
            if (err) {
              console.error(`Error searching in table ${tableName}:`, err);
              return reject(err);
            }
            resolve(rows); // 모든 데이터를 병합하기 위해 전체 데이터를 반환
          });
        });
      });

      // 모든 테이블의 검색 결과를 합친 후 클라이언트에 반환
      Promise.all(promises)
        .then((results) => {
          const mergedResults = [].concat(...results); // 모든 결과 합침
          if (mergedResults.length === 0) {
            return res
              .status(404)
              .json({ message: "No matching records found" });
          }
          res.json(mergedResults); // 병합된 전체 결과 반환
        })
        .catch((err) => {
          res.status(500).json({ error: "Error searching public events" });
        });
    }
  );
});

// 특정 이벤트 테이블에서 교회 데이터를 검색하는 API
app.get("/public/events/custom-search", (req, res) => {
  const { churchNumber, churchName, eventYear, eventName } = req.query;

  if (!eventYear || !eventName) {
    return res.status(400).json({ error: "Event year and name are required" });
  }

  const tableName = `${eventName}_${eventYear}`
    .replace(/\s+/g, "_") // 공백을 밑줄로 변환
    .replace(/[^a-zA-Z0-9_]/g, "") // 특수문자 제거
    .replace(/_+/g, "_") // 연속된 밑줄 제거
    .replace(/^_|_$/g, "") // 앞뒤의 밑줄 제거
    .toLowerCase();

  const query = `
    SELECT * FROM \`${tableName}\`
    WHERE CHURCHNUMBER = ? OR CHURCHNAME LIKE ?
  `;

  db.all(query, [churchNumber, `%${churchName}%`], (err, rows) => {
    if (err) {
      console.error(`Error searching in table ${tableName}:`, err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: "No matching records found" });
    }
    res.json(rows);
  });
});

// 404 핸들링
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// 서버 포트 설정
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
