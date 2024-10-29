import React, { useState } from "react";
import moment from "moment";

const ChurchReceiptPage = () => {
  const [churchNumber, setChurchNumber] = useState("");
  const [churchName, setChurchName] = useState(""); // 교회 이름 입력 필드 추가
  const [churchData, setChurchData] = useState(null);
  const [churchNumberOrName, setChurchNumberOrName] = useState(""); // 입력 필드 하나로 합침

  // 교회 데이터를 검색하는 함수
  const handleFetchReceipt = async () => {
    try {
      const searchTerm = churchNumberOrName.trim(); // 입력값을 받아서 공백을 제거

      let queryParam;
      // 숫자면 CHURCHNUMBER, 아니면 CHURCHNAME으로 검색
      if (!isNaN(searchTerm)) {
        queryParam = `churchNumber=${searchTerm}`;
      } else {
        queryParam = `churchName=${searchTerm}`;
      }

      const response = await fetch(
        `http://www.awanaevent.com:8080/public/events/search?${queryParam}`
      );

      if (!response.ok) {
        throw new Error("Church not found or event is not public");
      }

      const data = await response.json();

      if (data.length === 0) {
        throw new Error("No matching public event found");
      }

      setChurchData(data[0]); // 교회 데이터 저장 (첫 번째 데이터만 사용)
    } catch (error) {
      alert(error.message);
    }
  };

  // 내역 코드 변환 함수
  const getEventName = (code) => {
    if (!code) return "영성수련회 참가비"; // code 값이 없을 경우 기본값 반환
    switch (code.toUpperCase()) {
      case "RS":
        return "영성수련회 참가비";
      default:
        return "영성수련회 참가비"; // 코드가 없거나 매칭되지 않으면 '알 수 없음'
    }
  };

  // 내역 (년도-코드) 반환 함수
  const getEventDetails = (tableYear, eventCode) => {
    const year = tableYear || moment().format("YYYY"); // tableYear 값이 없으면 현재 연도 사용
    const eventName = getEventName(eventCode);
    return `${year}-${eventName}`;
  };

  const printReceipt = () => {
    const printContents =
      document.getElementById("receipt-container").innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // 페이지를 새로고침하여 원래 상태로 복구
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>영수증 출력 페이지</h1>
      <h4>교회등록번호 및 교회명을 입력하세요</h4>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={churchNumberOrName}
          onChange={(e) => setChurchNumberOrName(e.target.value)} // 하나의 입력 필드 사용
          placeholder="교회 번호 혹은 교회명을 입력하세요"
          style={styles.input}
        />
        <button onClick={handleFetchReceipt} style={styles.button}>
          영수증 조회
        </button>
      </div>

      {churchData && (
        <>
          <div id="receipt-container">
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
                      {getEventDetails(
                        churchData.TABLE_YEAR, // 해당 년도
                        churchData.CODE // 코드에 대응하는 이름
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.tableHeader}>영수지정인 (Received of)</td>
                    <td style={styles.tableCell}>{churchData.CHURCHNAME}</td>
                  </tr>
                  <tr>
                    <td style={styles.tableHeader}>참가자 수 (Participants)</td>
                    <td style={styles.tableCell}>
                      {churchData.PARTICIPANTS}명
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.tableHeader}>금액 (Amount)</td>
                    <td style={styles.tableCell}>{churchData.COST}원</td>
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
          <button
            className="print-button"
            onClick={printReceipt}
            style={styles.button}
          >
            영수증 출력
          </button>
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
  header: {
    fontSize: "24px",
    marginBottom: "20px",
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
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
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "20px",
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
};

export default ChurchReceiptPage;
