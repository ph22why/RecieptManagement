import React, { useState, useEffect } from "react";
import moment from "moment";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "http://www.awanaevent.com"
    : "http://localhost";

const eventCodeMapping = {
  YS: "영성수련회",
  BQF: "성경퀴즈대회 설명회",
  BQ: "성경퀴즈대회",
  YMS: "YM Summit",
  AMC: "컨퍼런스",
  BT1: "상반기 비티",
  BT2: "하반기 비티",
  BT: "수시비티",
  OLF: "올림픽 설명회",
  OL: "올림픽",
  TC: "티앤티 캠프",
  DC: "감독관학교",
  CC1: "조정관학교 101",
  CC2: "조정관학교 201",
  NR: "신규등록",
  RR: "재등록",
  ETC: "기타이벤트",
};

const ChurchReceiptPage = () => {
  const [churchData, setChurchData] = useState(null);
  const [churchNumberOrName, setChurchNumberOrName] = useState("");
  const [events, setEvents] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [fixedYear, setFixedYear] = useState("");
  const [fixedEvent, setFixedEvent] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${BASE_URL}:8080/admin/events`);
        const data = await response.json();

        setEvents(data);

        // Extract and deduplicate years
        const uniqueYears = [...new Set(data.map((event) => event.event_year))];
        setYears(uniqueYears);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  const handleCustomFetchReceipt = async () => {
    try {
      const searchTerm = churchNumberOrName.trim();

      let queryParam;
      if (!isNaN(searchTerm)) {
        queryParam = `churchNumber=${searchTerm}`;
      } else {
        queryParam = `churchName=${searchTerm}`;
      }

      if (!selectedYear || !selectedEvent) {
        throw new Error("이벤트 연도와 이름을 선택하세요.");
      }

      const response = await fetch(
        `${BASE_URL}:8080/public/events/custom-search?${queryParam}&eventYear=${selectedYear}&eventName=${selectedEvent}`
      );

      if (!response.ok) {
        throw new Error("검색 실패. 입력한 정보를 확인해주세요.");
      }
      setFixedYear(selectedYear);
      setFixedEvent(selectedEvent);
      const data = await response.json();
      setChurchData(data[0]);
    } catch (error) {
      alert(error.message);
    }
  };

  // // 공개된 이벤트에서 조회
  // const handleFetchReceipt = async () => {
  //   try {
  //     const searchTerm = churchNumberOrName.trim();
  //     let queryParam;
  //     if (!isNaN(searchTerm)) {
  //       queryParam = `churchNumber=${searchTerm}`;
  //     } else {
  //       queryParam = `churchName=${searchTerm}`;
  //     }

  //     const response = await fetch(
  //       `${BASE_URL}:8080/public/events/search?${queryParam}`
  //     );

  //     if (!response.ok) {
  //       throw new Error("검색 실패. 교회번호 혹은 교회명을 확인해주세요.");
  //     }

  //     const data = await response.json();

  //     if (data.length === 0) {
  //       throw new Error("공개된 이벤트가 없습니다. 본부로 문의해주세요");
  //     }

  //     setChurchData(data[0]);
  //   } catch (error) {
  //     alert(error.message);
  //   }
  // };

  const getEventName = (code) => {
    return eventCodeMapping[code.toUpperCase()] || "알 수 없음";
  };

  const getEventDetails = (selectedYear, selectedEvent) => {
    const year = selectedYear || moment().format("YYYY");
    const eventName = selectedEvent;
    return `${year}-${eventName}`;
  };

  const printReceipt = () => {
    const printContents =
      document.getElementById("receipt-container").innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>영수증 출력 페이지</h1>
      <h4 style={{ marginBottom: "0px", textAlign: "center" }}>
        출력하실 영수증의 이벤트 연도, 항목, 교회번호or교회명으로 검색해주세요
      </h4>
      <h5 style={{ marginBottom: "40px" }}>
        조회가 안될시 본부로 문의하세요 031-711-6533
      </h5>
      {/* 연도 및 이벤트 선택 드롭다운 */}
      <div style={styles.dropdownContainer}>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={styles.yeardropdown}
        >
          <option value="">이벤트 연도</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          style={styles.namedropdown}
        >
          <option value="">이벤트 이름</option>
          {events.map((event) => (
            <option key={event.event_name} value={event.event_name}>
              {getEventName(event.event_name)}
            </option>
          ))}
        </select>
        <div style={styles.inputContainer}>
          <input
            type="text"
            value={churchNumberOrName}
            onChange={(e) => setChurchNumberOrName(e.target.value)}
            placeholder="교회번호 혹은 교회명 입력"
            style={styles.input}
          />
          <button onClick={handleCustomFetchReceipt} style={styles.button}>
            영수증 조회
          </button>
        </div>
      </div>
      {churchData && (
        <>
          <button
            className="print-button"
            onClick={printReceipt}
            style={styles.printbutton}
          >
            인쇄 및 저장
          </button>
          <div
            id="receipt-container"
            style={{ position: "relative", left: "-6%" }}
          >
            <div id="receipt-content" style={styles.receiptContainer}>
              <h2 style={styles.receiptTitle}>영수증 (RECEIPT)</h2>
              <table style={styles.table}>
                <tbody>
                  <tr>
                    <td style={styles.tableHeader}>
                      NO.{" "}
                      {moment().format("YYMMDD") +
                        "-" +
                        String(churchData.id).padStart(3, "0")}
                    </td>
                    <td style={styles.tableCell}>고유번호: 129-82-73149</td>
                  </tr>
                  <tr>
                    <td style={styles.tableHeader}>내역 (Event)</td>
                    <td style={styles.tableCell}>
                      {fixedYear}-{getEventName(fixedEvent)}
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.tableHeader}>영수지정인 (Received of)</td>
                    <td style={styles.tableCell}>{churchData.CHURCHNAME}</td>
                  </tr>
                  <tr>
                    <td style={styles.tableHeader}>비고 (Participants)</td>
                    <td style={styles.tableCell}>
                      {churchData.PARTICIPANTS}
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.tableHeader}>금액 (Amount)</td>
                    <td style={styles.tableCell}>
                      {new Intl.NumberFormat().format(churchData.COST)}원
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="2" style={styles.tableNotice}>
                      상기 금액을 영수합니다.
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.tableHeader}>날짜 (Date)</td>
                    <td style={styles.tableCell}>
                      {moment().format("YYYY. M. D.")}
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.tableHeader}>담당 (By)</td>
                    <td style={styles.tableCell}>김승정</td>
                  </tr>
                </tbody>
              </table>
              <div style={styles.footer}>
                <h3 style={styles.awanaKorea}>AWANA KOREA</h3>
                <img src="/images/stamp.png" alt="Stamp" style={styles.stamp} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fff",
  },
  dropdownContainer: {
    position:"relative",
    left:"8%",
    flexWrap: "wrap",
    display: "flex",
    height: "40px",
    marginBottom: "20px",
  },
  yeardropdown: {
    width:"10%",
    padding: "10px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    minWidth: "150px", // 최소 너비 설정
    marginBottom: "10px", // 여백 추가
    marginRight:"10px"
  },
  namedropdown: {
    width:"30%",
    padding: "10px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    minWidth: "150px", // 최소 너비 설정
    marginBottom: "10px", // 여백 추가
  },
  header: {
    fontSize: "24px",
    marginBottom: "20px",
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    marginRight: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 20px",
    width: "140px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  receiptContainer: {
    textAlign: "left",
    padding: "20px",
    border: "2px solid #000",
    borderRadius: "8px",
    backgroundColor: "#fff !important",
    height: "550px",
    width: "150%",
    maxWidth: "750px",
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
    marginBottom: "20px",
  },
  receiptTitle: {
    textAlign: "center",
    fontSize: "24px",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#fff",
    marginBottom: "20px",
  },
  tableHeader: {
    fontWeight: "bold",
    padding: "10px",
    border: "1px solid #000",
    backgroundColor: "#fff",
    width: "50%",
  },
  tableCell: {
    padding: "10px",
    border: "1px solid #000",
    backgroundColor: "#fff",
    width: "50%",
  },
  tableNotice: {
    padding: "10px",
    border: "1px solid #000",
    backgroundColor: "#fff",
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    position: "relative",
    marginTop: "20px",
  },
  awanaKorea: {
    fontSize: "32px",
    display: "inline-block",
    marginTop: "50px",
    verticalAlign: "middle",
  },
  stamp: {
    width: "100px",
    height: "100px",
    position: "absolute",
    right: "200px",
    top: "50%",
    transform: "translateY(-50%)",
  },
  printbutton: {
    position:"relative",
    top:"-10px",
    left:"280px",
    padding: "10px 20px",
    width: "140px",
    marginBottom: "10px",
    fontSize: "16px",
    backgroundColor: "grey",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default ChurchReceiptPage;
