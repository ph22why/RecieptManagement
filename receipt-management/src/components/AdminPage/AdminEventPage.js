import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "http://www.awanaevent.com"
    : "http://localhost";

const AdminEventPage = () => {
  const [events, setEvents] = useState([]);
  const [churches, setChurches] = useState([]);
  const [newEvent, setNewEvent] = useState({ event_year: "", event_name: "" });
  const [selectedEvent, setSelectedEvent] = useState(null);
  // const [newChurchForEvent, setNewChurchForEvent] = useState({
  //   event_id: "",
  //   church_id: "",
  // });
  const [selectedFile, setSelectedFile] = useState(null); // 파일 업로드 상태 추가
  const [selectedEventId, setSelectedEventId] = useState(null); // 삭제할 이벤트 ID 저장
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // 삭제 확인 팝업 상태

  // 이벤트 매핑 데이터
  const eventMapping = [
    { code: "YS", name: "영성수련회" },
    { code: "BQF", name: "성경퀴즈대회 설명회" },
    { code: "BQ", name: "성경퀴즈대회" },
    { code: "YMS", name: "YM Summit"},
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

  // 이벤트 목록을 가져오는 함수
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${BASE_URL}:8080/admin/events`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("이벤트 목록 불러오기 오류:", error);
    }
  };

  // 교회 목록을 가져오는 함수
  const fetchChurches = async () => {
    try {
      const response = await fetch(`${BASE_URL}:8080/admin/churches`);
      const data = await response.json();

      // 교회 데이터가 배열인지 확인 후 설정
      if (Array.isArray(data)) {
        setChurches(data);
      } else {
        setChurches([]); // 배열이 아닌 경우 빈 배열로 처리
      }
    } catch (error) {
      console.error("교회 목록 불러오기 오류:", error);
      setChurches([]); // 오류 발생 시 빈 배열로 설정
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchChurches();
  }, []);

  // 새로운 이벤트 추가
  const handleAddEvent = async () => {
    try {
      const selectedMapping = eventMapping.find(
        (event) => event.name === newEvent.event_name
      );
      if (!selectedMapping) {
        alert("올바른 이벤트 이름을 선택하세요.");
        return;
      }

      const response = await fetch(`${BASE_URL}:8080/admin/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_year: newEvent.event_year,
          event_name: selectedMapping.code, // 영문 코드로 저장
          is_public: newEvent.is_public || 0, // 기본값으로 비공개 설정
        }),
      });

      if (response.ok) {
        alert("이벤트가 성공적으로 추가되었습니다.");
        fetchEvents(); // 이벤트 목록 다시 불러오기
        setNewEvent({ event_year: "", event_name: "", is_public: 0 });
      } else {
        const errorText = await response.text();
        alert(`이벤트 추가 실패: ${errorText}`);
      }
    } catch (error) {
      console.error("이벤트 추가 중 오류 발생:", error);
      alert("이벤트 추가 중 오류가 발생했습니다.");
    }
  };

  // 삭제 확인 다이얼로그 열기
  const openDeleteDialog = (eventId) => {
    setSelectedEventId(eventId);
    setIsDeleteDialogOpen(true);
  };

  // 삭제 확인 다이얼로그 닫기
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedEventId(null);
  };

  // 이벤트 삭제 함수
  const handleDeleteEvent = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}:8080/admin/events/${selectedEventId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        alert("이벤트가 성공적으로 삭제되었습니다.");
        fetchEvents(); // 삭제 후 이벤트 목록 다시 불러오기
      } else {
        alert("이벤트 삭제 실패.");
      }
    } catch (error) {
      console.error("이벤트 삭제 중 오류 발생:", error);
      alert("이벤트 삭제 중 오류가 발생했습니다.");
    } finally {
      closeDeleteDialog(); // 다이얼로그 닫기
    }
  };

  // 파일 선택 처리 함수
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // 엑셀 파일 업로드 및 테이블 생성
  const handleUploadFile = async () => {
    if (!selectedFile || !selectedEvent) {
      alert("이벤트를 선택하고 파일을 업로드해 주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("event_year", selectedEvent.event_year);
    formData.append("event_name", selectedEvent.event_name);

    try {
      const response = await fetch(`${BASE_URL}:8080/admin/uploadExcel`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("엑셀 파일이 성공적으로 업로드되었습니다.");
      } else {
        alert("엑셀 파일 업로드 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("파일 업로드 중 오류:", error);
      alert("파일 업로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        이벤트 관리 페이지
      </Typography>

      {/* 새로운 이벤트 추가 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>새로운 이벤트 추가</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper elevation={3} style={{ padding: 16 }}>
            {/* 이벤트 이름을 드롭다운으로 변경 */}
            <TextField
              select
              label="이벤트 이름"
              value={newEvent.event_name}
              onChange={(e) =>
                setNewEvent({ ...newEvent, event_name: e.target.value })
              }
              fullWidth
              margin="normal"
            >
              {eventMapping.map((event) => (
                <MenuItem key={event.code} value={event.name}>
                  {event.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="이벤트 연도"
              value={newEvent.event_year}
              onChange={(e) =>
                setNewEvent({ ...newEvent, event_year: e.target.value })
              }
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddEvent}
              style={{ marginTop: 16 }}
            >
              이벤트 추가
            </Button>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* 엑셀 파일 업로드 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>엑셀 파일 업로드 및 테이블 생성</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper elevation={3} style={{ padding: 16 }}>
            {/* 샘플 엑셀 다운로드 버튼 */}
            <Button
              variant="contained"
              color="secondary"
              href="/sample.xlsx"
              download="sample.xlsx"
              style={{ marginTop: 16 }}
            >
              샘플 엑셀 다운
            </Button>
            <TextField
              select
              label="이벤트 선택"
              value={selectedEvent ? selectedEvent.id : ""}
              onChange={(e) => {
                const selected = events.find(
                  (event) => event.id === e.target.value
                );
                setSelectedEvent(selected);
              }}
              fullWidth
              margin="normal"
            >
              {events.map((event) => {
                const matchedEvent = eventMapping.find(
                  (mapping) => mapping.code === event.event_name
                );
                const displayName = matchedEvent
                  ? matchedEvent.name
                  : event.event_name;

                return (
                  <MenuItem key={event.id} value={event.id}>
                    {displayName} - {event.event_year}
                  </MenuItem>
                );
              })}
            </TextField>

            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              style={{ marginTop: 16 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleUploadFile}
              style={{ marginTop: 16 }}
            >
              파일 업로드
            </Button>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* 이벤트 목록 */}
      <TableContainer component={Paper} style={{ marginTop: 32 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>이벤트 이름</TableCell>
              <TableCell>이벤트 연도</TableCell>
              <TableCell>삭제</TableCell>
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
                <TableCell>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => openDeleteDialog(event.id)} // 다이얼로그 열기
                  >
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>정말로 이 이벤트를 삭제하시겠습니까?</DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            취소
          </Button>
          <Button onClick={handleDeleteEvent} color="secondary">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminEventPage;
