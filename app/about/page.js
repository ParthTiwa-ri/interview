export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About InterviewPrep</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Our Mission</h2>
        <p className="text-gray-600 mb-4">
          InterviewPrep is designed to help job seekers practice and prepare for interviews
          using AI-powered technology. We generate realistic interview questions based on your
          target role and provide detailed feedback on your responses.
        </p>
        <p className="text-gray-600">
          Our goal is to help you build confidence, identify areas for improvement, and
          ultimately succeed in your job interviews.
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">How It Works</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-600">
          <li>Enter the job role you're interviewing for</li>
          <li>Receive AI-generated interview questions specific to that role</li>
          <li>Answer the questions as you would in a real interview</li>
          <li>Get detailed feedback and scoring on your responses</li>
          <li>Review your strengths and areas for improvement</li>
          <li>Practice again to improve your scores</li>
        </ol>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Us</h2>
        <p className="text-gray-600">
          If you have any questions or feedback, please reach out to us at{" "}
          <a href="mailto:support@interviewprep.com" className="text-blue-600 hover:underline">
            support@interviewprep.com
          </a>
        </p>
      </div>
    </div>
  );
} 