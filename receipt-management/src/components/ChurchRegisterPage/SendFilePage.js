import "./SendFilestyle.css";
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid2,
  Button,
  Checkbox,
} from "@mui/material";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://awanaevent.com"
    : "http://localhost:8080";

const SendFilePage = () => {
  const location = useLocation();
  const [tableName, setTableName] = useState(location.state?.tableName || "");
  const [basicInfo, setBasicInfo] = useState({});
  const [sparksList, setSparksList] = useState([]);
  const [ttList, setTtList] = useState([]);
  const [sparksApprovalData, setSparksApprovalData] = useState([]);
  const [ttApprovalData, setTtApprovalData] = useState([]);
  const [observers, setObservers] = useState([
    {
      id: 1,
      name: "Sparks 클럽원 (선수 외의)",
      count: 0,
      hasMeal: true,
      hasPin: true,
    },
    {
      id: 2,
      name: "Sparks 교사 (코치 외의)",
      count: 0,
      hasMeal: true,
      hasPin: true,
    },
    {
      id: 3,
      name: "T&T 클럽원 (선수 외의)",
      count: 0,
      hasMeal: true,
      hasPin: true,
    },
    {
      id: 4,
      name: "T&T 교사 (코치 외의)",
      count: 0,
      hasMeal: true,
      hasPin: true,
    },
    {
      id: 5,
      name: "학부모 포함 식권 별도 구입인원",
      count: 0,
      hasMeal: true,
      hasPin: false,
    },
  ]);

  useEffect(() => {
    if (!tableName) {
      console.error("Table name is not provided.");
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/register/${tableName}`);
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        // console.log(data);
        setBasicInfo({
          region: data.basicInfo?.region || "",
          church_name: data.basicInfo?.church_name || "",
          representative: data.basicInfo?.representative || "",
          contact: data.basicInfo?.contact || "",
        });

        const updatedObservers = [
          {
            id: 1,
            name: "Sparks 클럽원 (선수 외의)",
            count: data.observers?.[0]?.observer_count || 0,
            hasMeal: true,
            hasPin: true,
          },
          {
            id: 2,
            name: "Sparks 교사 (코치 외의)",
            count: data.observers?.[1]?.observer_count || 0,
            hasMeal: true,
            hasPin: true,
          },
          {
            id: 3,
            name: "T&T 클럽원 (선수 외의)",
            count: data.observers?.[2]?.observer_count || 0,
            hasMeal: true,
            hasPin: true,
          },
          {
            id: 4,
            name: "T&T 교사 (코치 외의)",
            count: data.observers?.[3]?.observer_count || 0,
            hasMeal: true,
            hasPin: true,
          },
          {
            id: 5,
            name: "학부모 포함 식권 별도 구입인원",
            count: data.observers?.[4]?.observer_count || 0,
            hasMeal: true,
            hasPin: false,
          },
        ];
        setObservers(updatedObservers);

        setSparksList(
          data.sparksList.map((item, index) => ({
            id: item.id,
            typeId: index + 1,
            handbook: item.handbook,
            churchName: item.church_name || "",
            playerName: item.player_name || "",
            coachName: item.coach_name || "",
            coachContact: item.coach_contact || "",
            region: basicInfo.region || "N/A",
            approved: false, // 기본 승인 상태
            rejection_reason: null, // 기본 반려 사유
            type: "sparks",
            uiNumber: index + 1,
          }))
        );

        setTtList(
          data.ttList.map((item, index) => ({
            id: item.id,
            typeId: index + 1,
            handbook: item.handbook,
            churchName: item.church_name || "",
            playerName: item.player_name || "",
            coachName: item.coach_name || "",
            coachContact: item.coach_contact || "",
            region: basicInfo.region || "N/A",
            approved: false, // 기본 승인 상태
            rejection_reason: null, // 기본 반려 사유
            type: "tt",
            uiNumber: index + 1,
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };
    fetchData();
    // Approval 데이터 병합
    fetchApprovalData(tableName);
    setSparksList((prev) => mergeApprovalData(prev, sparksApprovalData || []));
    setTtList((prev) => mergeApprovalData(prev, ttApprovalData || []));
  }, [tableName]);

  const fetchApprovalData = async (event) => {
    try {
      const tableName = `${event}_players`; // 현재 테이블 이름에 "_players" 추가
      const response = await fetch(
        `${BASE_URL}/admin/events/${tableName}/approve-data`
      );
      if (!response.ok) throw new Error("Failed to fetch approval data");
      const data = await response.json();

      const sparksApproval = data.filter((item) => item.type === "sparks");
      const ttApproval = data.filter((item) => item.type === "tt");
      setSparksApprovalData(sparksApproval);
      setTtApprovalData(ttApproval);
    } catch (error) {
      console.error("Error fetching approval data:", error);

      // Approval 데이터가 없는 경우, 빈 배열로 초기화
      setSparksApprovalData([]);
      setTtApprovalData([]);
    }
  };

  // 데이터 병합
  const mergeApprovalData = (list, approvalData) => {
    return list.map((item) => {
      const approvalInfo = approvalData.find(
        (data) => data.type_id === item.typeId
      );
      console.log("approvalInfo:", approvalInfo);
      return {
        ...item,
        approved: approvalInfo ? approvalInfo.approved : false, // 승인 상태 기본값 false
        rejection_reason: approvalInfo ? approvalInfo.rejection_reason : null, // 반려 사유 기본값 null
      };
    });
  };

  const printRef = useRef(null);

  const handlePrint = () => {
    if (printRef.current) {
      const originalContent = document.body.innerHTML; // 원래 문서 내용을 저장
      const printContent = printRef.current.innerHTML; // 인쇄할 내용
      document.body.innerHTML = printContent; // 현재 문서를 인쇄할 내용으로 변경
      window.print(); // 브라우저 인쇄 호출
      document.body.innerHTML = originalContent; // 원래 내용 복원
      window.location.reload(); // 페이지 새로고침
    } else {
      console.error("printRef가 null입니다. 확인해보세요.");
    }
  };

  const counts = {
    // Sparks 참가자 수
    sparksPlayers: sparksList.length, // 분류1에서 입력받은 Sparks 선수 수
    sparksCoaches: new Set(
      sparksList
        .filter((item) => item.coachName?.trim() && item.coachContact?.trim()) // 유효한 코치만 포함
        .map((item) => `${item.coachName}-${item.coachContact}`)
    ).size, // Sparks 코치 (중복 제거)

    // T&T 참가자 수
    ttPlayers: ttList.length, // 분류2에서 입력받은 T&T 선수 수
    ttCoaches: new Set(
      ttList
        .filter((item) => item.coachName?.trim() && item.coachContact?.trim()) // 유효한 코치만 포함
        .map((item) => `${item.coachName}-${item.coachContact}`)
    ).size, // T&T 코치 (중복 제거)

    // 참관자 수
    observers: observers.reduce(
      (total, obs) => parseInt(total) + parseInt(obs.count),
      0
    ), // 분류3에서 입력받은 참관자 인원 합계

    // Sparks/T&T 코치 표식
    sparksCoachMarkers: parseInt(
      new Set(
        sparksList
          .filter((item) => item.coachName?.trim() && item.coachContact?.trim()) // 유효한 코치만 포함
          .map((item) => `${item.coachName}-${item.coachContact}`)
      ).size
    ), // Sparks 코치 + Sparks 참관 교사 수
    ttCoachMarkers: parseInt(
      new Set(
        ttList
          .filter((item) => item.coachName?.trim() && item.coachContact?.trim()) // 유효한 코치만 포함
          .map((item) => `${item.coachName}-${item.coachContact}`)
      ).size
    ), // T&T 코치 + T&T 참관 교사 수

    // Sparks 선수 핀 계산
    sparksPins: {
      행글라이더: sparksList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("행글라이더") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
      윙러너: sparksList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("윙러너") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
      스카이스토머: sparksList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("스카이스토머") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
    },

    // T&T 선수 핀 계산
    ttPins: {
      어드밴처1: ttList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("어드밴처1") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
      어드밴처2: ttList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("어드밴처2") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
      챌린지1: ttList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("챌린지1") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
      챌린지2: ttList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("챌린지2") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
    },
  };

  const calculateItems = () => {
    const sparksPins = sparksList.length;
    const ttPins = ttList.length;

    // 코치의 고유한 쌍 추출
    const uniqueSparksCoaches = new Set(
      sparksList.map((item) => `${item.coachName}-${item.coachContact}`)
    );
    const uniqueTtCoaches = new Set(
      ttList.map((item) => `${item.coachName}-${item.coachContact}`)
    );

    // 코치 수 계산
    const sparksCoaches = uniqueSparksCoaches.size;
    const ttCoaches = uniqueTtCoaches.size;

    // 참관 인원 계산
    const sparkObserverPins =
      parseInt(observers[0].count || 0, 10) +
      parseInt(observers[1].count || 0, 10);
    const ttObserverPins =
      parseInt(observers[2].count || 0, 10) +
      parseInt(observers[3].count || 0, 10);
    const extraMealTickets = parseInt(observers[4].count || 0, 10);

    // 총 식권 계산
    const totalMealTickets =
      sparksPins + ttPins + sparksCoaches + ttCoaches + extraMealTickets;

    // 선수인원계산
    const sparksStudent = sparksPins - sparksCoaches;
    const ttStudent = ttPins - ttCoaches;

    return {
      sparksPins,
      ttPins,
      sparkObserverPins,
      ttObserverPins,
      totalMealTickets,
      sparksCoaches,
      ttCoaches,
      sparksStudent,
      ttStudent,
    };
  };

  // Calculated Costs
  const calculateCosts = () => {
    const sparksCost = counts.sparksPlayers * 25000; // 스팍스 선수 1인
    const sparksCoachCost = counts.sparksCoaches * 20000;
    const ttCost = counts.ttPlayers * 25000; // 티앤티 선수 1인
    const ttCoachCost = counts.ttCoaches * 20000;
    const observerCosts =
      observers[0].count * 12000 +
      observers[1].count * 12000 +
      observers[2].count * 12000 +
      observers[3].count * 12000 +
      observers[4].count * 8000;

    return sparksCost + sparksCoachCost + ttCost + ttCoachCost + observerCosts;
  };

  const items = calculateItems();
  const costs = calculateCosts();

  const handlePhotoUpload = async (
    type_id,
    type,
    event,
    playerName,
    churchName,
    approved = 0
  ) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("player_name", playerName); // 선수 이름 추가
    formData.append("church_name", churchName); // 교회 이름 추가
    formData.append("photo_path", file.name); // 파일 경로 추가
    formData.append("approved", approved); // 승인 상태 추가
    formData.append("type", type); // 선수 유형 추가
    formData.append("region", basicInfo.region); // 참가 지역 추가
    formData.append("type_id", type_id); // 참가 지역 추가

    try {
      const response = await fetch(
        `${BASE_URL}/admin/${tableName}/upload/${type}/${type_id}`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Upload failed");

      alert("사진 업로드 성공!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("사진 업로드 실패!");
    }
  };

  const renderApprovalRow = (player, index) => {
    const typeId = index + 1; // index + 1을 typeId로 활용
    return (
      <TableRow key={player.id}>
        <TableCell>{player.type_id}</TableCell>
        <TableCell>{player.region || "N/A"}</TableCell>
        <TableCell>{player.player_name || "N/A"}</TableCell>
        <TableCell>{player.church_name || "N/A"}</TableCell>
        <TableCell>
          {player.approved ? (
            <span style={{ color: "green" }}>승인 완료</span>
          ) : player.rejection_reason ? (
            <>
              <Button variant="contained" component="label" color="secondary">
                사진 업로드
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(event) =>
                    handlePhotoUpload(
                      player.type_id,
                      player.type,
                      event,
                      player.player_name,
                      player.church_name
                    )
                  }
                />
              </Button>
              <span style={{ color: "red", marginLeft: "10px" }}>
                {`반려 사유: ${player.rejection_reason}`}
              </span>
            </>
          ) : (
            <Button variant="contained" component="label" color="secondary">
              사진 업로드
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(event) =>
                  handlePhotoUpload(
                    player.type_id,
                    player.type,
                    event,
                    player.player_name,
                    player.church_name
                  )
                }
              />
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };
  
  const renderPlayerRow = (player, index, type) => {
    // approvalData를 먼저 확인
    const approvalData =
      (type === "sparks" ? sparksApprovalData : ttApprovalData).find(
        (approval) => approval.type_id === index + 1
      ) || {};

    // 데이터가 있으면 approvalData 우선, 없으면 player 데이터 사용
    const type_id = approvalData.type_id || index + 1;
    const region = approvalData.region || basicInfo.region || "N/A";
    const player_name = approvalData.player_name || player.playerName || "N/A";
    const church_name = approvalData.church_name || player.churchName || "N/A";
    const approved = approvalData.approved || player.approved || false;
    const rejectionReason = approvalData.rejection_reason;
    return (
      <TableRow key={player.id}>
        <TableCell>{type_id}</TableCell>
        <TableCell>{region}</TableCell>
        <TableCell>{player_name}</TableCell>
        <TableCell>{church_name}</TableCell>
        <TableCell>
          {approved ? (
            <span style={{ color: "green" }}>승인 완료</span>
          ) : rejectionReason ? (
            <>
              <Button variant="contained" component="label" color="secondary">
                사진 업로드
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(event) =>
                    handlePhotoUpload(
                      type_id,
                      type,
                      event,
                      player_name,
                      church_name
                    )
                  }
                />
              </Button>
              <span style={{ color: "red", marginLeft: "10px" }}>
                {`반려 사유: ${rejectionReason}`}
              </span>
            </>
          ) : (
            <Button variant="contained" component="label" color="secondary">
              사진 업로드
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(event) =>
                  handlePhotoUpload(
                    type_id,
                    type,
                    event,
                    player_name,
                    church_name
                  )
                }
              />
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };
  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        margin: "0 auto",
      }}
    >
      <Typography
        variant="h5"
        style={{ marginBottom: "20px", textAlign: "center" }}
      >
        신청된 명단 조회
      </Typography>
      {/* 인쇄 버튼 */}
      <Button
        variant="contained"
        color="primary"
        style={{ marginBottom: "20px" }}
        onClick={handlePrint}
      >
        인쇄하기
      </Button>
      <span style={{ padding: "20px" }}>
        <Typography variant="h5" gutterBottom>
          자료 제출
        </Typography>

        <Typography variant="h6">Sparks</Typography>
        <Paper style={{ marginBottom: "20px", padding: "10px" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>번호</TableCell>
                <TableCell>참가 지역</TableCell>
                <TableCell>선수 이름</TableCell>
                <TableCell>교회명</TableCell>
                <TableCell>자료 제출</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sparksList.map((player, index) =>
                renderPlayerRow(player, index, "sparks")
              )}
            </TableBody>
          </Table>
        </Paper>
        <Typography variant="h6">T&T</Typography>
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>번호</TableCell>
                <TableCell>참가 지역</TableCell>
                <TableCell>선수 이름</TableCell>
                <TableCell>교회명</TableCell>
                <TableCell>자료 제출</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ttList.map((player, index) =>
                renderPlayerRow(player, index, "tt")
              )}
            </TableBody>
          </Table>
        </Paper>
      </span>
      <div ref={printRef}>
        {/* 1줄: 기본정보 */}
        <div className="page">
          <Grid2
            container
            justifyContent="center"
            alignItems="center"
            spacing={2}
            style={{ marginBottom: "20px" }}
          >
            <Grid2 item xs={12}>
              <Paper
                elevation={3}
                style={{
                  padding: "20px",
                  border: "1px solid #004d40",
                  borderRadius: "10px",
                  height: "130px",
                }}
              >
                <Typography
                  variant="h6"
                  style={{
                    marginBottom: "10px",
                    textAlign: "center",
                    backgroundColor: "#e0f7fa",
                    padding: "10px",
                    borderRadius: "5px",
                  }}
                >
                  기본 정보
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        참가지역
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        교회명
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        담당자
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        연락처
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        {basicInfo.region || "N/A"}
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {basicInfo.church_name || "N/A"}
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {basicInfo.representative || "N/A"}
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {basicInfo.contact || "N/A"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid2>
            {/* 접수내역 추가 */}
            {/* <Grid2 item xs={12}>
            <Paper
              elevation={3}
              style={{
                padding: "20px",
                border: "1px solid #004d40",
                borderRadius: "10px",
                height: "130px",
              }}
            >
              <Typography
                variant="h6"
                style={{
                  marginBottom: "10px",
                  textAlign: "center",
                  backgroundColor: "#e0f7fa",
                  padding: "10px",
                  borderRadius: "5px",
                }}
              >
                접수 내역
              </Typography>
              <Grid2 container spacing={2}>
                <Grid2 item xs={12}>
                  <Typography style={{ textAlign: "center", fontWeight: "bold", marginTop: "40px" }}>
                    전체 참가비: {new Intl.NumberFormat().format(costs)}원
                  </Typography>
                </Grid2>
              </Grid2>
            </Paper>
          </Grid2> */}
          </Grid2>
        </div>

        {/* Sparks */}
        <Grid2
          container
          justifyContent="center"
          alignItems="center"
          spacing={1}
          style={{ marginBottom: "20px" }}
        >
          <div className="page">
            <Grid2 item xs={4}>
              <Paper
                elevation={3}
                style={{
                  padding: "20px",
                  border: "1px solid #004d40",
                  borderRadius: "10px",
                }}
              >
                <Typography
                  variant="h6"
                  style={{
                    marginBottom: "10px",
                    textAlign: "center",
                    backgroundColor: "#e0f7fa",
                    padding: "10px",
                    borderRadius: "5px",
                  }}
                >
                  Sparks 명단
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        순번
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        핸드북
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        교회명
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        선수이름
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        코치이름
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        코치연락처
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sparksList.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell style={{ textAlign: "center" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {item.handbook || "N/A"}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {item.churchName || "N/A"}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {item.playerName || "N/A"}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {item.coachName || "N/A"}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {item.coachContact || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid2>
          </div>
        </Grid2>
        {/* T&T */}
        <Grid2
          container
          justifyContent="center"
          alignItems="center"
          spacing={1}
          style={{ marginBottom: "20px" }}
        >
          <div className="page">
            <Grid2 item xs={4}>
              <Paper
                elevation={3}
                style={{
                  padding: "20px",
                  border: "1px solid #004d40",
                  borderRadius: "10px",
                }}
              >
                <Typography
                  variant="h6"
                  style={{
                    marginBottom: "10px",
                    textAlign: "center",
                    backgroundColor: "#e0f7fa",
                    padding: "10px",
                    borderRadius: "5px",
                  }}
                >
                  T&T 명단
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        순번
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        핸드북
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        교회명
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        선수이름
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        코치이름
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        코치연락처
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ttList.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell style={{ textAlign: "center" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {item.handbook || "N/A"}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {item.churchName || "N/A"}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {item.playerName || "N/A"}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {item.coachName || "N/A"}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {item.coachContact || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid2>
          </div>
        </Grid2>

        {/* 참관자 */}
        <Grid2
          container
          justifyContent="center"
          alignItems="center"
          spacing={3}
          style={{ marginBottom: "20px" }}
        >
          <div className="page">
            <Grid2 item xs={4}>
              <Paper
                elevation={3}
                style={{
                  padding: "20px",
                  border: "1px solid #004d40",
                  borderRadius: "10px",
                }}
              >
                <Typography
                  variant="h6"
                  style={{
                    marginBottom: "10px",
                    textAlign: "center",
                    backgroundColor: "#e0f7fa",
                    padding: "10px",
                    borderRadius: "5px",
                  }}
                >
                  참관자 명단
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        구분
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        인원수
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        식권
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: "#b2dfdb",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        참가핀
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {observers.map((observer) => (
                      <TableRow key={observer.id}>
                        <TableCell style={{ textAlign: "center" }}>
                          {observer.name || "N/A"}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {observer.count || 0}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {observer.hasMeal ? "O" : "X"}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {observer.hasPin ? "O" : "X"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid2>
          </div>
        </Grid2>

        {/* 최종수령물품 및 수량 */}
        <div className="page">
          <Grid2
            container
            justifyContent="center"
            alignItems="top"
            spacing={1}
            style={{ marginBottom: "20px" }}
          >
            {/* 핸브북 별 수령 품목 및 수량 */}
            <Grid2 item xs={12} md={6}>
              <Paper
                elevation={3}
                style={{
                  padding: "20px",
                  backgroundColor: "#e0f7fa",
                  borderRadius: "10px",
                  border: "1px solid #004d40",
                }}
              >
                <Typography
                  variant="subtitle1"
                  style={{
                    color: "#004d40",
                    fontWeight: 600,
                    textAlign: "center",
                    marginBottom: "10px",
                  }}
                >
                  최종 핸드북별 핀 수량
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        style={{ fontWeight: "bold", textAlign: "center" }}
                      >
                        항목
                      </TableCell>
                      <TableCell
                        style={{ fontWeight: "bold", textAlign: "center" }}
                      >
                        수량
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        행글라이더
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.sparksPins["행글라이더"]}개
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        윙러너
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.sparksPins["윙러너"]}개
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        스카이스토머
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.sparksPins["스카이스토머"]}개
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        어드밴처1
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.ttPins["어드밴처1"]}개
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        어드밴처2
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.ttPins["어드밴처2"]}개
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        챌린지1
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.ttPins["챌린지1"]}개
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        챌린지2
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.ttPins["챌린지2"]}개
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid2>
            {/* 참관자 수령 품목 및 수량 */}
            <Grid2 item xs={12} md={6}>
              <Paper
                elevation={3}
                style={{
                  padding: "20px",
                  backgroundColor: "#e0f7fa",
                  borderRadius: "10px",
                  border: "1px solid #004d40",
                }}
              >
                <Typography
                  variant="subtitle1"
                  style={{
                    color: "#004d40",
                    fontWeight: 600,
                    textAlign: "center",
                    marginBottom: "10px",
                  }}
                >
                  최종 수령 품목 및 수량
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        style={{ fontWeight: "bold", textAlign: "center" }}
                      >
                        항목
                      </TableCell>
                      <TableCell
                        style={{ fontWeight: "bold", textAlign: "center" }}
                      >
                        수량
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        Sparks 참관핀
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {items.sparkObserverPins}개
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        Sparks 코치 표식
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.sparksCoachMarkers}개
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        T&T 참관핀
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {items.ttObserverPins}개
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        T&T 코치 표식
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.ttCoachMarkers}개
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        총 식권
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.sparksPlayers +
                          counts.sparksCoaches +
                          counts.ttPlayers +
                          counts.ttCoaches +
                          counts.observers}
                        장
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid2>

            {/* 최종 참가 인원 */}
            <Grid2 item xs={12} md={6}>
              <Paper
                elevation={3}
                style={{
                  padding: "20px",
                  backgroundColor: "#e0f7fa",
                  borderRadius: "10px",
                  border: "1px solid #004d40",
                }}
              >
                <Typography
                  variant="subtitle1"
                  style={{
                    color: "#004d40",
                    fontWeight: 600,
                    textAlign: "center",
                    marginBottom: "10px",
                  }}
                >
                  최종 참가 인원
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        style={{ fontWeight: "bold", textAlign: "center" }}
                      >
                        구분
                      </TableCell>
                      <TableCell
                        style={{ fontWeight: "bold", textAlign: "center" }}
                      >
                        인원수
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        Sparks 선수
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.sparksPlayers}명
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        Sparks 코치
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.sparksCoaches}명
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        T&T 선수
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.ttPlayers}명
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        T&T 코치
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.ttCoaches}명
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>
                        참관자 + 추가 식사자
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        {counts.observers}명
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid2>

            {/* 총 참가비 */}
            <Grid2 item xs={12}>
              <Paper
                elevation={3}
                style={{
                  padding: "20px",
                  backgroundColor: "#e8f5e9",
                  borderRadius: "10px",
                  border: "1px solid #1b5e20",
                }}
              >
                <Typography
                  variant="subtitle1"
                  style={{
                    color: "#1b5e20",
                    fontWeight: 600,
                    textAlign: "center",
                    marginBottom: "10px",
                  }}
                >
                  총 참가비
                </Typography>
                <Typography
                  style={{
                    textAlign: "center",
                    color: "#2e7d32",
                    fontWeight: 700,
                    fontSize: "1.2rem",
                  }}
                >
                  {new Intl.NumberFormat().format(costs)}원
                </Typography>
              </Paper>
            </Grid2>
          </Grid2>
        </div>
      </div>
    </div>
  );
};

export default SendFilePage;
