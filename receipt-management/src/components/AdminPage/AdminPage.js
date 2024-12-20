import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  CircularProgress,
  Select,
  MenuItem,
} from "@mui/material";
import * as XLSX from "xlsx";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://awanaevent.com"
    : "http://localhost:8080";

const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://awanaevent.com" // 프로덕션 백엔드 URL
    : "http://localhost:8080"; // 개발 환경에서의 백엔드 URL

const AdminPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // 선택된 이벤트 저장
  const [eventData, setEventData] = useState([]); // 선택된 이벤트의 데이터 저장
  const [headers, setHeaders] = useState([]); // 동적으로 컬럼 헤더 저장
  const [isPublic, setIsPublic] = useState(0); // 공개 여부 상태
  const [editRow, setEditRow] = useState(null); // 수정 중인 행 저장
  const [newRow, setNewRow] = useState(null); // 새로운 행 저장
  const [isAddingRow, setIsAddingRow] = useState(false); // 새로운 행 추가 중인지 확인
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // 저장 확인 팝업
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false); // 삭제 확인 팝업
  const [deleteRowId, setDeleteRowId] = useState(null); // 삭제할 행의 ID 저장
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const [error, setError] = useState(""); // 에러 메시지 상태
  const [openSnackbar, setOpenSnackbar] = useState(false); // 스낵바 열기 상태
  const [registrationData, setRegistrationData] = useState([]); // 등록 데이터를 저장
  const [registrationHeaders, setRegistrationHeaders] = useState([]); // 등록 데이터 컬럼 헤더
  const [churchData, setChurchData] = useState([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [popupData, setPopupData] = useState(null); // 팝업에서 보여줄 데이터
  const [openRejectionDialog, setOpenRejectionDialog] = useState(false);
  const [rejectingChurchId, setRejectingChurchId] = useState(null);

  // 이벤트 매핑 데이터
  const eventMapping = [
    { code: "YS", name: "영성수련회" },
    { code: "BQF", name: "성경퀴즈대회 설명회" },
    { code: "BQ", name: "성경퀴즈대회" },
    { code: "YMS", name: "YM Summit" },
    { code: "AMC", name: "컨퍼런스" },
    { code: "BT1", name: "상반기 비티" },
    { code: "BT2", name: "하반기 비티" },
    { code: "BT", name: "수시비티" },
    { code: "OLF", name: "올림픽 설명회" },
    { code: "OL", name: "올림픽" },
    { code: "TC", name: "티앤티 캠프" },
    { code: "DC", name: "감독관학교" },
    { code: "CC1", name: "조정관학교 101" },
    { code: "CC2", name: "조정관학교 201" },
    { code: "NR", name: "신규등록" },
    { code: "RR", name: "재등록" },
    { code: "ETC", name: "기타이벤트" },
  ];

  // 서버에서 이벤트 목록을 가져오는 함수
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/events`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // 이벤트 데이터 초기화
  const handleResetEventData = async () => {
    if (!selectedEvent) {
      alert("초기화할 이벤트가 선택되지 않았습니다.");
      return;
    }

    const confirmReset = window.confirm(
      `정말로 "${selectedEvent.event_name}" 이벤트의 영수증 데이터를 초기화하시겠습니까?`
    );
    if (!confirmReset) return;

    try {
      const response = await fetch(
        `${BASE_URL}/admin/events/${selectedEvent.id}/reset-data`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert(
        `"${selectedEvent.event_name}" 이벤트의 데이터가 초기화되었습니다.`
      );
      fetchEventData(selectedEvent.id); // 초기화 후 데이터를 다시 가져오기
    } catch (error) {
      console.error("Error resetting event data:", error);
      alert("데이터 초기화 중 오류가 발생했습니다.");
    }
  };

  // 이벤트 데이터 엑셀로 내보내기
  const exportToExcel = () => {
    const filteredData = eventData.filter(filterValidRows);

    // 필터링된 데이터를 시트 형식으로 변환
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Event Data");

    // 엑셀 파일 다운로드
    XLSX.writeFile(workbook, `${selectedEvent.event_name}_filtered_data.xlsx`);
  };

  const exportRegisterToExcel = () => {
    if (!registrationData.length) {
      alert("엑셀로 내보낼 데이터가 없습니다.");
      return;
    }

    const workbook = XLSX.utils.book_new(); // 새 워크북 생성

    // 1. "전체" 시트 생성
    const allSheet = XLSX.utils.json_to_sheet(registrationData);
    XLSX.utils.book_append_sheet(workbook, allSheet, "전체");

    // 핸드북별로 데이터 그룹화 (띄어쓰기 전까지)
    const groupedData = registrationData.reduce((acc, row) => {
      const handbookFull = row["핸드북"] || "기타";
      const handbook = handbookFull.split(" ")[0]; // 띄어쓰기 전까지 추출
      if (!acc[handbook]) acc[handbook] = [];
      acc[handbook].push(row);
      return acc;
    }, {});

    // 각 핸드북에 대해 Sheet 생성
    Object.keys(groupedData).forEach((handbook) => {
      const sheetData = groupedData[handbook];

      // 핸드북 데이터에서 컬럼 헤더와 데이터 생성
      const worksheet = XLSX.utils.json_to_sheet(sheetData);

      // 워크북에 Sheet 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, handbook);
    });

    // 엑셀 파일 다운로드
    XLSX.writeFile(workbook, "등록데이터.xlsx");
  };

  // 등록데이터 영수증데이터로 다운
  const exportReceiptExcel = async () => {
    if (!registrationData || registrationData.length === 0) {
      alert("등록 데이터를 먼저 조회하세요.");
      return;
    }

    if (
      !selectedEvent ||
      !selectedEvent.event_name ||
      !selectedEvent.event_year
    ) {
      alert("이벤트 이름과 연도를 찾을 수 없습니다.");
      return;
    }

    console.log("Exporting Excel for:", { selectedEvent });

    try {
      const response = await fetch(`${BASE_URL}/admin/receipts/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_year: selectedEvent.event_year,
          event_name: selectedEvent.event_name,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 이벤트 이름 매핑
      const participantsName =
        eventMapping.find((event) => event.code === selectedEvent.event_name)
          ?.name || selectedEvent.event_name;

      // 디버깅: 반환된 데이터를 출력
      console.log("Fetched data:", data);

      const excelData = [
        [
          "NO",
          "PAYDATE",
          "CHURCHNUMBER",
          "CHURCHNAME",
          "LEADERNAME",
          "LEADERPHONE",
          "PARTICIPANTS",
          "COST",
        ], // Header
        ...data.map((item) => [
          item.NO,
          item.PAYDATE,
          item.CHURCHNUMBER,
          item.CHURCHNAME,
          item.LEADERNAME,
          item.LEADERPHONE,
          participantsName,
          item.COST,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Receipts");

      const excelFileName = `${selectedEvent.event_name}_${selectedEvent.event_year}_Receipts.xlsx`;
      XLSX.writeFile(workbook, excelFileName);

      console.log("Excel file generated successfully!");
    } catch (error) {
      console.error("Error exporting Excel:", error.message);
    }
  };

  // 승인 및 반려 로직
  const handleDataFetch = async (event) => {
    setSelectedEvent(event); // 선택된 이벤트 업데이트
    const data = await fetchChurchData(event); // 데이터 가져오기
    setChurchData(data); // 가져온 데이터 상태 업데이트
  };

  // 사진 확인 팝업
  const openPhotoPopup = (data) => {
    console.log(data.photo_path);
    setPopupData(data); // 팝업에 표시할 데이터 설정
  };

  const closePhotoPopup = () => {
    setPopupData(null); // 팝업 종료
    setRejectionReason(""); // 반려 사유 초기화
  };

  const approvePhoto = async () => {
    try {
      // 사진 저장 로직 호출
      await handleApproval(
        popupData.type_id,
        popupData.type,
        popupData.church_name,
        popupData.player_name,
        popupData.photo_path
      );
      closePhotoPopup();
      // 승인 후 데이터 재조회
      handleDataFetch(selectedEvent);
    } catch (error) {
      console.error("Error approving photo:", error);
    }
  };

  const rejectPhoto = async () => {
    try {
      // 반려 처리 로직 호출
      await handleRejection(
        popupData.type_id,
        rejectionReason,
        popupData.photo_path
      );
      closePhotoPopup();
      alert("사진이 반려되었습니다.");
      // 반려 후 데이터 재조회
      handleDataFetch(selectedEvent);
    } catch (error) {
      console.error("Error rejecting photo:", error);
    }
  };

  // 이벤트 공개 여부 설정
  const handleSetPublic = async (eventId, isPublic) => {
    try {
      const response = await fetch(
        `${BASE_URL}/admin/events/${eventId}/public`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_public: isPublic }),
        }
      );

      if (response.ok) {
        alert(`이벤트가 ${isPublic ? "공개" : "비공개"}되었습니다.`);
        fetchEvents(); // 공개 상태 업데이트
      } else {
        alert("공개 설정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error setting event public:", error);
    }
  };

  // Snackbar 닫기
  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
    setError("");
  };

  // 수정된 데이터를 저장하는 함수
  const handleSaveRow = async () => {
    if (!selectedEvent) {
      alert("이벤트를 선택하세요.");
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/admin/events/${selectedEvent.id}/data/${editRow.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...editRow, // 수정된 데이터
            event_year: selectedEvent.event_year, // 이벤트의 연도
            event_name: selectedEvent.event_name, // 이벤트 이름
          }),
        }
      );

      if (response.ok) {
        alert("데이터가 성공적으로 저장되었습니다.");
        fetchEventData(selectedEvent.id); // 수정된 데이터 다시 불러오기
        setEditRow(null); // 수정 상태 초기화
      } else {
        alert("데이터 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving row:", error);
    }
  };

  // 선택된 이벤트의 데이터를 가져오는 함수 (컬럼명 포함)
  const fetchEventData = async (eventId) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/events/${eventId}/data`);
      const data = await response.json();

      if (data.length > 0) {
        const columnNames = Object.keys(data[0]); // 첫 번째 행의 키들을 컬럼명으로 사용
        setHeaders(columnNames);
        setEventData(data);
      } else {
        setHeaders([]); // 데이터가 없을 경우 헤더를 비워둠
        setEventData([]);
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
    }
  };

  // 교회별 자료 가져오기
  const fetchChurchData = async (event) => {
    try {
      setIsLoading(true);
      const eventtablename = `${event.event_name}_${event.event_year}`;
      const response = await fetch(
        `${BASE_URL}/admin/events/${eventtablename}/player-data`
      );
      const data = await response.json();
      setChurchData(data);
      console.log(`${eventtablename} Fetched Church Data:`, data);
      return data;
    } catch (error) {
      console.error("Error fetching church data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 승인 처리
  const handleApproval = async (
    type_id,
    type,
    churchName,
    playerName,
    photoPath
  ) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type_id,
          type,
          church_name: churchName,
          player_name: playerName,
          photo_path: photoPath,
        }),
      });

      if (!response.ok) throw new Error("Approval failed");

      // 파일 다운로드 처리
      const blob = await response.blob(); // 서버에서 파일 데이터를 받아옴
      const newFileName = `${churchName}_${playerName}${photoPath.substring(
        photoPath.lastIndexOf(".")
      )}`;

      // 다운로드 링크 생성 및 실행
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = newFileName;
      downloadLink.click();

      alert("사진이 성공적으로 저장되었습니다!");
    } catch (error) {
      console.error("Error approving photo:", error);
      alert("사진 승인 실패!");
    }
  };

  // 반려 처리
  const handleRejection = async (id, reason, photoPath) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          rejection_reason: reason,
          photo_path: photoPath, // photo_path 추가
        }),
      });
      if (!response.ok) throw new Error("Rejection failed");
    } catch (error) {
      console.error("Error rejecting photo:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 이벤트 선택 처리
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsPublic(event.is_public); // 공개 여부를 상태로 설정
    fetchEventData(event.id); // 선택된 이벤트의 데이터 가져오기
  };

  // 수정 중인 행 처리
  const handleEditRow = (row) => {
    setEditRow(row);
  };

  // 수정 확인 팝업 열기
  const handleSaveConfirmation = () => {
    setOpenConfirmDialog(true);
  };

  // 삭제 확인 팝업 열기
  const handleDeleteConfirmation = (rowId) => {
    setDeleteRowId(rowId);
    setOpenDeleteDialog(true);
  };

  // 수정 데이터 저장 확인
  const handleConfirmSave = async () => {
    await handleSaveRow(); // 수정 데이터를 백엔드로 저장
    setOpenConfirmDialog(false); // 팝업 닫기
    setEditRow(null); // 수정 중인 행 초기화
  };

  // 삭제 데이터 확인
  const handleConfirmDelete = async () => {
    await handleDeleteRow(deleteRowId); // 선택된 행 삭제
    setOpenDeleteDialog(false); // 팝업 닫기
    setDeleteRowId(null); // 삭제 상태 초기화
  };

  // 팝업에서 취소 시
  const handleCancelDialog = () => {
    setOpenConfirmDialog(false); // 수정 팝업 닫기
    setOpenDeleteDialog(false); // 삭제 팝업 닫기
  };

  const [filter, setFilter] = useState("all"); // 상태 필터 ('all', 'approved', 'unapproved')

  // 필터링된 데이터
  const approvalData = churchData.filter((data) => {
    if (filter === "all") return true;
    if (filter === "approved") return data.approved === 1; // 승인된 데이터
    if (filter === "unapproved") return data.approved === 0; // 미승인 데이터
    return true;
  });

  // 등록 데이터 가져오기
  const fetchRegistrationData = async (event) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${BASE_URL}/admin/events/${event.event_name}/registration-data?year=${event.event_year}`
      );

      const data = await response.json();

      console.log(data);

      if (data.length > 0) {
        // 필요한 컬럼 설정
        setRegistrationHeaders([
          "참가지역",
          "핸드북",
          "등록번호",
          "교회명",
          "선수이름",
          "코치이름",
          "코치연락처",
        ]);

        // 데이터 매핑
        setRegistrationData(
          data.map((item) => ({
            참가지역: item.region,
            핸드북: item.handbook,
            등록번호: item.church_number, // 등록번호 추가
            교회명: item.church_name,
            선수이름: item.player_name,
            코치이름: item.coach_name,
            코치연락처: item.coach_contact,
          }))
        );

        // 이벤트 이름과 연도를 상태에 저장
        setSelectedEvent({
          event_name: event.event_name,
          event_year: event.event_year,
        });
      } else {
        setRegistrationHeaders([]);
        setRegistrationData([]);
      }
    } catch (error) {
      console.error("Error fetching registration data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 데이터 삭제 처리
  const handleDeleteRow = async (rowId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/admin/events/${selectedEvent.id}/data/${rowId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        alert("데이터가 성공적으로 삭제되었습니다.");
        fetchEventData(selectedEvent.id); // 삭제 후 데이터 다시 불러오기
      } else {
        alert("데이터 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  // 교회 데이터 유효성 확인 함수 (CHURCHNAME 및 CHURCHNUMBER가 존재하는지 확인)
  const filterValidRows = (row) => {
    return row["CHURCHNAME"] || row["CHURCHNUMBER"];
  };

  // 개별 추가 버튼 클릭 시 빈 데이터 생성
  const handleAddRow = () => {
    if (isAddingRow) {
      setNewRow(null); // 개별 추가 취소 시 초기화
      setIsAddingRow(false);
    } else {
      const maxId = Math.max(...eventData.map((row) => row.id || 0), 0);
      const maxNo = Math.max(...eventData.map((row) => row.NO || 0), 0);

      const emptyRow = headers.reduce(
        (acc, header) => {
          if (header === "id") acc["id"] = maxId + 1; // id 자동 설정
          else if (header === "NO") acc["NO"] = maxNo + 1; // NO 자동 설정
          else acc[header] = ""; // 다른 값은 빈 값으로 초기화
          return acc;
        },
        { id: maxId + 1, NO: maxNo + 1 }
      );

      setNewRow(emptyRow); // 새 행을 상태로 설정
      setIsAddingRow(true); // 개별 추가 중으로 설정
    }
  };

  // 개별 추가된 데이터를 저장
  const handleSaveNewRow = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/admin/events/${selectedEvent.id}/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newRow),
        }
      );

      if (response.ok) {
        alert("데이터가 성공적으로 추가되었습니다.");
        fetchEventData(selectedEvent.id); // 추가된 데이터 다시 불러오기
        setNewRow(null); // 새 행 초기화
        setIsAddingRow(false); // 추가 중 상태 초기화
      } else {
        alert("데이터 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error adding new row:", error);
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        이벤트 관리 페이지
      </Typography>
      {/* 이벤트 목록 */}
      {isLoading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} style={{ marginTop: 32 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>이벤트 이름</TableCell>
                <TableCell>이벤트 연도</TableCell>
                <TableCell>공개 여부</TableCell>
                <TableCell>공개 설정</TableCell>
                <TableCell>등록 데이터 조회</TableCell>
                <TableCell>영수증 데이터 조회</TableCell>
                <TableCell>성취 기록 카드 확인</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    {eventMapping.find(
                      (mapping) => mapping.code === event.event_name
                    )?.name || event.event_name}
                  </TableCell>
                  <TableCell>{event.event_year}</TableCell>
                  <TableCell>{event.is_public ? "공개" : "비공개"}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color={event.is_public ? "secondary" : "primary"}
                      onClick={() =>
                        handleSetPublic(event.id, event.is_public ? 0 : 1)
                      }
                    >
                      {event.is_public ? "비공개로 설정" : "공개로 설정"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      onClick={() => fetchRegistrationData(event)}
                      color="primary"
                    >
                      등록 데이터 조회
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      onClick={() => handleSelectEvent(event)}
                    >
                      영수증 데이터 조회
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      onClick={() => handleDataFetch(event)}
                    >
                      성취 기록 확인
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Snackbar for Error/Success Messages */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={error}
      />
      {/* 등록 데이터 테이블 */}
      {registrationData.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <Typography variant="h5" gutterBottom>
            등록 데이터
          </Typography>
          {/* 등록 데이터 엑셀 다운로드 버튼 */}
          {registrationData.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              style={{ marginTop: 16 }}
              onClick={exportRegisterToExcel}
            >
              등록 데이터 엑셀 다운로드
            </Button>
          )}
          {/* 영수증 데이터 엑셀 다운로드 버튼 */}
          {registrationData.length > 0 && (
            <Button
              variant="contained"
              color="success"
              style={{ marginTop: 16, marginLeft: 20 }}
              onClick={exportReceiptExcel}
            >
              영수증 데이터 엑셀 다운로드
            </Button>
          )}
          <TableContainer component={Paper} style={{ marginTop: 16 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {registrationHeaders.map((header, index) => (
                    <TableCell key={index}>{header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {registrationData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {registrationHeaders.map((header, cellIndex) => (
                      <TableCell key={cellIndex}>{row[header]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
      {/* 선택된 이벤트 데이터 조회 */}
      {selectedEvent && (
        <div style={{ marginTop: 32 }}>
          <Button
            variant="contained"
            color={isAddingRow ? "secondary" : "primary"}
            onClick={handleAddRow}
            style={{ marginBottom: 16, marginLeft: 16 }}
          >
            {isAddingRow ? "취소" : "개별 추가"}
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={exportToExcel} // 엑셀 다운로드 버튼
            style={{ marginBottom: 16, marginLeft: 16 }}
          >
            엑셀 다운로드
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={handleResetEventData} // 엑셀 다운로드 버튼
            style={{ marginBottom: 16, marginLeft: 90 }}
          >
            초기화
          </Button>

          <TableContainer component={Paper} style={{ marginTop: 16 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableCell key={index}>{header}</TableCell>
                  ))}
                  <TableCell>수정</TableCell>
                  <TableCell>삭제</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {newRow && (
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableCell key={index}>
                        <TextField
                          value={newRow[header]}
                          onChange={(e) =>
                            setNewRow({ ...newRow, [header]: e.target.value })
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button variant="contained" onClick={handleSaveNewRow}>
                        저장
                      </Button>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}

                {eventData
                  .filter(filterValidRows) // CHURCHNAME과 CHURCHNUMBER가 있는 행만 필터링
                  .map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {editRow && editRow.id === row.id ? (
                            <TextField
                              value={editRow[header]}
                              onChange={(e) =>
                                setEditRow({
                                  ...editRow,
                                  [header]: e.target.value,
                                })
                              }
                            />
                          ) : (
                            row[header]
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        {editRow && editRow.id === row.id ? (
                          <Button
                            variant="contained"
                            onClick={handleSaveConfirmation}
                          >
                            저장
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={() => handleEditRow(row)}
                          >
                            수정
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => handleDeleteConfirmation(row.id)}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
      {/* 파일 업로드 데이터 조회 */}
      {churchData.length > 0 && (
        <>
          <Typography variant="h5" style={{ marginBottom: "10px" }}>
            조회된 자료
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>
                    <Select
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                      style={{ marginBottom: "20px" }}
                    >
                      <MenuItem value="all">전체</MenuItem>
                      <MenuItem value="경상">경상(포항기쁨의교회)</MenuItem>
                      <MenuItem value="서울강원">서울,강원(왕성교회)</MenuItem>
                      <MenuItem value="충청">충청(대전중앙교회)</MenuItem>
                      <MenuItem value="전라">전라(여수성광교회)</MenuItem>
                      <MenuItem value="경기인천강원">경기,인천,강원(인천숭의교회)</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>선수 이름</TableCell>
                  <TableCell>교회 이름</TableCell>
                  <TableCell>
                    <Select
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                      style={{ marginBottom: "20px" }}
                    >
                      <MenuItem value="all">전체</MenuItem>
                      <MenuItem value="approved">승인됨</MenuItem>
                      <MenuItem value="unapproved">미승인</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>조치</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvalData.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell>{data.type_id}</TableCell>
                    <TableCell>{data.region}</TableCell>
                    <TableCell>{data.player_name}</TableCell>
                    <TableCell>{data.church_name}</TableCell>
                    <TableCell>{data.approved ? "승인됨" : "미승인"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        onClick={() => openPhotoPopup(data)}
                      >
                        성취 기록 카드 확인
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {popupData && (
        <Dialog open={!!popupData} onClose={closePhotoPopup}>
          <DialogTitle>사진 확인</DialogTitle>
          <DialogContent>
            <img
              src={`${BASE_URL}/${popupData.photo_path}`}
              alt="Popup"
              style={{ width: "100%" }}
            />
            <Typography>
              교회: {popupData.church_name}, 선수: {popupData.player_name}
            </Typography>
            {!popupData.approved && (
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="반려 사유를 입력하세요."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ marginTop: "20px" }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closePhotoPopup} color="primary">
              닫기
            </Button>
            {!popupData.approved && (
              <>
                <Button onClick={rejectPhoto} color="secondary">
                  반려
                </Button>
                <Button onClick={approvePhoto} color="primary">
                  승인
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* 저장 확인 팝업 */}
      <Dialog open={openConfirmDialog} onClose={handleCancelDialog}>
        <DialogTitle>저장 확인</DialogTitle>
        <DialogContent>수정 내용을 저장하시겠습니까?</DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialog} color="primary">
            취소
          </Button>
          <Button onClick={handleConfirmSave} color="primary">
            저장
          </Button>
        </DialogActions>
      </Dialog>
      {/* 삭제 확인 팝업 */}
      <Dialog open={openDeleteDialog} onClose={handleCancelDialog}>
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>정말로 삭제하시겠습니까?</DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialog} color="primary">
            취소
          </Button>
          <Button onClick={handleConfirmDelete} color="secondary">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminPage;
