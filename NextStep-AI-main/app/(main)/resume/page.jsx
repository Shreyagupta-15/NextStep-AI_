import React from 'react'
import ResumeBuilder from './_component/resume-builder'
import { getResume } from "@/actions/resume";

const ResumePage = async () => {
    const resume = await getResume()
  return (
    <div>
<ResumeBuilder initialContent={resume?.content}/>
    </div>
  )
}

export default ResumePage
