const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const multer = require("multer");
const xlsx = require("xlsx");
const upload = multer({ dest: "uploads/" });

const app = express();
app.use(cors());
app.use(bodyParser.json());

// DB 저장 위치 설정 (데이터베이스 파일이 로컬에 저장됨)
const dbPath = path.resolve(__dirname, "churches.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database.");
    // 외래 키 제약 조건 활성화
    db.run("PRAGMA foreign_keys = ON");

    // 테이블 생성
    db.run(`
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_year TEXT,
                event_name TEXT
            )
        `);
    db.run(`
            CREATE TABLE IF NOT EXISTS church_event (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER,
                church_id INTEGER,
                FOREIGN KEY (event_id) REFERENCES events(id),
                FOREIGN KEY (church_id) REFERENCES churches(id)
            )
        `);
    db.run(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_name TEXT
            )
        `);
    // 새로운 컬럼을 추가합니다 (events 테이블에 공개 여부).
    db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_year TEXT,
    event_name TEXT,
    is_public INTEGER DEFAULT 0  -- 0은 비공개, 1은 공개를 의미합니다.
  )
`);
  }
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

// 공개된 이벤트 목록 가져오기
app.get("/events", (req, res) => {
  const query = "SELECT * FROM events WHERE is_public = 1";
  db.all(query, (err, rows) => {
    if (err) {
      console.error("Error fetching public events:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(rows);
  });
});

// 새로운 이벤트 추가
app.post("/admin/events", (req, res) => {
  const { event_year, event_name } = req.body;
  if (!event_year || !event_name) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const query = `INSERT INTO events (event_year, event_name) VALUES (?, ?)`;
  db.run(query, [event_year, event_name], function (err) {
    if (err) {
      console.error("Error adding new event:", err);
      return res.status(500).json({ error: "Server error" });
    }
    const express = require("express");
    const cors = require("cors");
    const bodyParser = require("body-parser");
    const sqlite3 = require("sqlite3").verbose();
    const path = require("path");
    const multer = require("multer");
    const xlsx = require("xlsx");
    const upload = multer({ dest: "uploads/" });

    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    // DB 저장 위치 설정 (데이터베이스 파일이 로컬에 저장됨)
    const dbPath = path.resolve(__dirname, "churches.db");
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err);
      } else {
        console.log("Connected to SQLite database.");
        // 외래 키 제약 조건 활성화
        db.run("PRAGMA foreign_keys = ON");

        // 테이블 생성
        db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_year TEXT,
        event_name TEXT,
        is_public INTEGER DEFAULT 0 -- 0은 비공개, 1은 공개를 의미합니다.
      )
    `);

        // 기존 events 테이블에 is_public 컬럼 추가
        db.run(
          `
      ALTER TABLE events ADD COLUMN is_public INTEGER DEFAULT 0
    `,
          (err) => {
            if (err && !err.message.includes("duplicate column")) {
              console.error("Error adding is_public column:", err);
            } else {
              console.log("is_public column added or already exists.");
            }
          }
        );

        db.run(`
      CREATE TABLE IF NOT EXISTS church_event (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        church_id INTEGER,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (church_id) REFERENCES churches(id)
      )
    `);

        db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name TEXT
      )
    `);
      }
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
      const { event_name, event_year, is_public } = req.body;

      if (!event_name || !event_year) {
        return res.status(400).json({ error: "Invalid input" });
      }

      const query = `UPDATE events SET event_name = ?, event_year = ?, is_public = ? WHERE id = ?`;
      db.run(query, [event_name, event_year, is_public, id], function (err) {
        if (err) {
          console.error(`Error updating event with ID ${id}:`, err);
          return res.status(500).json({ error: "Server error" });
        }
        res.status(200).json({ message: "Event updated successfully" });
      });
    });

    // 새로운 이벤트 추가
    app.post("/admin/events", (req, res) => {
      const { event_year, event_name } = req.body;
      if (!event_year || !event_name) {
        return res.status(400).json({ error: "Invalid input" });
      }
      const query = `INSERT INTO events (event_year, event_name) VALUES (?, ?)`;
      db.run(query, [event_year, event_name], function (err) {
        if (err) {
          console.error("Error adding new event:", err);
          return res.status(500).json({ error: "Server error" });
        }
        res.status(201).json({ message: "Event added successfully" });
      });
    });

    // 새로운 이벤트 추가
    app.post("/admin/events", (req, res) => {
      const { event_year, event_name, is_public } = req.body;
      if (!event_year || !event_name) {
        return res.status(400).json({ error: "Invalid input" });
      }

      const query = `INSERT INTO events (event_year, event_name, is_public) VALUES (?, ?, ?)`;
      db.run(query, [event_year, event_name, is_public], function (err) {
        if (err) {
          console.error("Error adding new event:", err);
          return res.status(500).json({ error: "Server error" });
        }
        res.status(201).json({ message: "Event added successfully" });
      });
    });

    // 특정 이벤트에 속한 교회 목록 가져오기
    app.get("/admin/events/:eventId/churches", (req, res) => {
      const eventId = req.params.eventId;
      const query = `
                SELECT c.* 
                FROM churches c
                INNER JOIN church_event ce ON c.id = ce.church_id
                WHERE ce.event_id = ?`;

      db.all(query, [eventId], (err, rows) => {
        if (err) {
          console.error(`Error fetching churches for event ${eventId}:`, err);
          return res.status(500).json({ error: "Server error" });
        }
        res.json(rows);
      });
    });

    // 교회를 특정 이벤트에 연결
    app.post("/admin/events/:eventId/churches/:churchId", (req, res) => {
      const { eventId, churchId } = req.params;

      // 중복 연결 체크
      const checkQuery = `SELECT * FROM church_event WHERE event_id = ? AND church_id = ?`;
      db.get(checkQuery, [eventId, churchId], (err, row) => {
        if (err) {
          console.error(`Error checking church-event link:`, err);
          return res.status(500).json({ error: "Server error" });
        }
        if (row) {
          return res
            .status(409)
            .json({ message: "Church already linked to event" });
        }

        const query = `INSERT INTO church_event (event_id, church_id) VALUES (?, ?)`;
        db.run(query, [eventId, churchId], function (err) {
          if (err) {
            console.error(
              `Error linking church ${churchId} to event ${eventId}:`,
              err
            );
            return res.status(500).json({ error: "Server error" });
          }
          res
            .status(201)
            .json({ message: "Church linked to event successfully" });
        });
      });
    });

    // 카테고리 목록 가져오기
    app.get("/admin/categories", (req, res) => {
      db.all("SELECT * FROM categories", (err, rows) => {
        if (err) {
          console.error("Error fetching categories:", err);
          return res.status(500).json({ error: "Server error" });
        }
        res.json(rows);
      });
    });

    // 새로운 카테고리 추가
    app.post("/admin/categories", (req, res) => {
      const { category_name } = req.body;
      if (!category_name) {
        return res.status(400).json({ error: "Invalid input" });
      }

      const query = `INSERT INTO categories (category_name) VALUES (?)`;
      db.run(query, [category_name], function (err) {
        if (err) {
          console.error("Error adding new category:", err);
          return res.status(500).json({ error: "Server error" });
        }
        res.status(201).json({ message: "Category added successfully" });
      });
    });

    // 카테고리 수정
    app.put("/admin/categories/:id", (req, res) => {
      const categoryId = req.params.id;
      const { category_name } = req.body;
      if (!category_name) {
        return res.status(400).json({ error: "Invalid input" });
      }

      const query = `UPDATE categories SET category_name = ? WHERE id = ?`;
      db.run(query, [category_name, categoryId], function (err) {
        if (err) {
          console.error(`Error updating category ${categoryId}:`, err);
          return res.status(500).json({ error: "Server error" });
        }
        res.status(200).json({ message: "Category updated successfully" });
      });
    });

    // 교회 목록 가져오기
    app.get("/admin/churches", (req, res) => {
      const query = "SELECT * FROM churches";
      db.all(query, (err, rows) => {
        if (err) {
          console.error("Error fetching churches:", err);
          return res.status(500).json({ error: "Server error" });
        }
        res.json(rows);
      });
    });

    // 교회 목록 가져오기
    app.get("/admin/churches", (req, res) => {
      const query = "SELECT * FROM churches";
      db.all(query, (err, rows) => {
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
        [
          church_number,
          church_name,
          number_of_participants,
          curriculum_type,
          id,
        ],
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

      // 1. 각 열의 데이터를 테이블로 처리
      const columns = jsonData[0]; // 첫 번째 행 (A1, B1, ...)을 테이블 이름으로 사용
      const dataRows = jsonData.slice(1); // 나머지 행들은 테이블의 데이터로 사용

      // 각 열에 대해 테이블 생성 및 데이터 삽입
      columns.forEach((tableName, colIndex) => {
        // 테이블 이름 정리 (특수문자 제거)
        const cleanTableName = tableName
          .replace(/\s+/g, "_") // 공백을 밑줄로 변환
          .replace(/[^a-zA-Z0-9_]/g, "") // 특수문자 제거
          .replace(/_+/g, "_") // 연속된 밑줄을 하나로 변환
          .replace(/^_|_$/g, "") // 앞뒤에 붙은 밑줄 제거
          .toLowerCase(); // 소문자로 변환

        // 테이블 생성 쿼리 (한 열의 데이터만 저장하는 테이블)
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${cleanTableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        value TEXT
      )
    `;

        db.run(createTableQuery, (err) => {
          if (err) {
            console.error(`Error creating table ${cleanTableName}:`, err);
            return res
              .status(500)
              .send(`Error creating table ${cleanTableName}.`);
          }

          // 데이터 삽입 쿼리 준비 (각 행의 데이터 삽입)
          const insertQuery = `INSERT INTO ${cleanTableName} (value) VALUES (?)`;

          dataRows.forEach((row) => {
            const value = row[colIndex]; // 각 열의 데이터를 가져옴
            if (value !== undefined) {
              db.run(insertQuery, [value], (err) => {
                if (err) {
                  console.error(
                    `Error inserting data into ${cleanTableName}:`,
                    err
                  );
                }
              });
            }
          });
        });
      });

      res.send(
        "File uploaded, tables created, and data inserted successfully."
      );
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

    res.status(201).json({ message: "Event added successfully" });
  });
});

// 특정 이벤트에 속한 교회 목록 가져오기
app.get("/admin/events/:eventId/churches", (req, res) => {
  const eventId = req.params.eventId;
  const query = `
        SELECT c.* 
        FROM churches c
        INNER JOIN church_event ce ON c.id = ce.church_id
        WHERE ce.event_id = ?`;

  db.all(query, [eventId], (err, rows) => {
    if (err) {
      console.error(`Error fetching churches for event ${eventId}:`, err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(rows);
  });
});

// 교회를 특정 이벤트에 연결
app.post("/admin/events/:eventId/churches/:churchId", (req, res) => {
  const { eventId, churchId } = req.params;

  // 중복 연결 체크
  const checkQuery = `SELECT * FROM church_event WHERE event_id = ? AND church_id = ?`;
  db.get(checkQuery, [eventId, churchId], (err, row) => {
    if (err) {
      console.error(`Error checking church-event link:`, err);
      return res.status(500).json({ error: "Server error" });
    }
    if (row) {
      return res
        .status(409)
        .json({ message: "Church already linked to event" });
    }

    const query = `INSERT INTO church_event (event_id, church_id) VALUES (?, ?)`;
    db.run(query, [eventId, churchId], function (err) {
      if (err) {
        console.error(
          `Error linking church ${churchId} to event ${eventId}:`,
          err
        );
        return res.status(500).json({ error: "Server error" });
      }
      res.status(201).json({ message: "Church linked to event successfully" });
    });
  });
});

// 카테고리 목록 가져오기
app.get("/admin/categories", (req, res) => {
  db.all("SELECT * FROM categories", (err, rows) => {
    if (err) {
      console.error("Error fetching categories:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(rows);
  });
});

// 새로운 카테고리 추가
app.post("/admin/categories", (req, res) => {
  const { category_name } = req.body;
  if (!category_name) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const query = `INSERT INTO categories (category_name) VALUES (?)`;
  db.run(query, [category_name], function (err) {
    if (err) {
      console.error("Error adding new category:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.status(201).json({ message: "Category added successfully" });
  });
});

// 카테고리 수정
app.put("/admin/categories/:id", (req, res) => {
  const categoryId = req.params.id;
  const { category_name } = req.body;
  if (!category_name) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const query = `UPDATE categories SET category_name = ? WHERE id = ?`;
  db.run(query, [category_name, categoryId], function (err) {
    if (err) {
      console.error(`Error updating category ${categoryId}:`, err);
      return res.status(500).json({ error: "Server error" });
    }
    res.status(200).json({ message: "Category updated successfully" });
  });
});

// 특정 이벤트의 데이터를 가져오는 API
app.get("/admin/events/:id/data", (req, res) => {
  const { id } = req.params;

  // 먼저 해당 이벤트의 이름과 연도를 조회하여 테이블 이름을 얻어옴
  const eventQuery = "SELECT event_name, event_year FROM events WHERE id = ?";

  db.get(eventQuery, [id], (err, event) => {
    if (err) {
      console.error(`Error fetching event with ID ${id}:`, err);
      return res.status(500).json({ error: "Server error" });
    }

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // 테이블 이름을 구성
    const tableName = `${event.event_name}_${event.event_year}`
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase();

    // 해당 이벤트에 해당하는 데이터를 조회
    const query = `SELECT * FROM ${tableName}`;

    db.all(query, (err, rows) => {
      if (err) {
        console.error(`Error fetching data for event ${id}:`, err);
        return res.status(500).json({ error: "Error fetching event data" });
      }

      res.json(rows); // 조회한 데이터를 반환
    });
  });
});

// 엑셀 파일 업로드 및 동적 컬럼 생성 API
app.post("/admin/uploadExcel", upload.single("file"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const columns = jsonData[0]; // 첫 번째 행을 컬럼명으로 사용
  const rows = jsonData.slice(1); // 나머지 행은 데이터로 사용

  // 이름_연도 형식으로 테이블 이름 생성
  const tableName = `${req.body.event_name}_${req.body.event_year}`
    .replace(/\s+/g, "_") // 공백을 밑줄로 변환
    .replace(/[^a-zA-Z0-9_]/g, "") // 특수문자 제거
    .replace(/_+/g, "_") // 연속된 밑줄을 하나로 변환
    .replace(/^_|_$/g, "") // 앞뒤에 붙은 밑줄 제거
    .toLowerCase(); // 소문자로 변환

  // 특수문자 제거를 위해 정규식을 활용하여 테이블명 수정
  const cleanTableName = tableName.replace(/[^\w]/g, "_");

  // 동적으로 테이블 및 컬럼 생성
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${cleanTableName} (
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

    // 데이터 삽입 쿼리 준비
    const insertQuery = `
            INSERT INTO ${cleanTableName} (${columns
      .map((col) => col.replace(/[^\w]/g, "_"))
      .join(", ")})
            VALUES (${columns.map(() => "?").join(", ")})
        `;

    // 각 행을 데이터베이스에 삽입
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

// 404 핸들링
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// 서버 포트 설정
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
