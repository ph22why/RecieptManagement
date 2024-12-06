import React from "react";
import { useParams, useLocation } from "react-router-dom";
import BQForm from "./EventForms/BQForm"; // 성경퀴즈대회 양식
import YSForm from "./EventForms/YSForm"; // 영성수련회 양식
import DefaultForm from "./EventForms/DefaultForm"; // 기본 양식

const EventFormRouter = () => {
  const { eventCode } = useParams(); // URL에서 eventCode 파라미터 가져오기
  const location = useLocation();
  const { tableName, fullPin } = location.state || {}; // 전달된 tableName 가져오기

  if (!tableName) {
    return <div>올바른 테이블 정보가 없습니다. 다시 시도해주세요.</div>;
  }

  switch (eventCode) {
    case "BQ":
      return <BQForm tableName={tableName} fullPin={fullPin} />;
    case "YS":
      return <YSForm tableName={tableName} />;
    default:
      return <DefaultForm />;
  }
};

export default EventFormRouter;
