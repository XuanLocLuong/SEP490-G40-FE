import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { previewApply, applyToJob } from '../../apis/ApplicationApi.jsx';
import { getReasonMessage, getApplyErrorMessage } from '../../utils/applicationErrorMessages.js';
import { ROUTES } from '../../routes/path.js';
import '../../assets/styles/ApplyDemoButtonStyle.css';

// Nút demo nhỏ — gắn tạm vào bất kỳ đâu (job card, trang test...) để kiểm
// tra luồng Preview -> Apply thật, trước khi ghép vào Job Detail chính thức.
const ApplyDemoButton = ({ jobId }) => {
    const [step, setStep] = useState('idle'); // idle | loading | preview | applying | success | error
    const [preview, setPreview] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleOpenPreview = async () => {
        setStep('loading');
        setErrorMessage('');
        try {
            const res = await previewApply(jobId);
            setPreview(res.data.data);
            setStep('preview');
        } catch (err) {
            setErrorMessage(getApplyErrorMessage(err));
            setStep('error');
        }
    };

    const handleConfirmApply = async () => {
        setStep('applying');
        try {
            await applyToJob(jobId);
            setStep('success');
        } catch (err) {
            setErrorMessage(getApplyErrorMessage(err));
            setStep('error');
        }
    };

    return (
        <div className="apply-demo">
            <button
                type="button"
                className="btn btn--primary"
                onClick={handleOpenPreview}
                disabled={step === 'loading' || step === 'applying'}
            >
                {step === 'loading' ? 'Đang kiểm tra...' : 'Ứng tuyển (demo)'}
            </button>

            {step === 'preview' && preview && (
                <div className="apply-demo__panel">
                    <p className="apply-demo__job">
                        <strong>{preview.jobTitle}</strong> — {preview.businessName}
                    </p>

                    {preview.eligible ? (
                        <>
                            <p className="apply-demo__ok">✓ Đủ điều kiện ứng tuyển.</p>
                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={handleConfirmApply}
                            >
                                Xác nhận ứng tuyển
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="apply-demo__blocked">Bạn chưa thể ứng tuyển:</p>
                            <ul className="apply-demo__reasons">
                                {preview.blockingReasons.map((reason) => (
                                    <li key={reason}>{getReasonMessage(reason)}</li>
                                ))}
                            </ul>
                            {preview.blockingReasons.includes('PROFILE_INCOMPLETE') && (
                                <button
                                    type="button"
                                    className="btn btn--ghost"
                                    onClick={() => navigate(ROUTES.CANDIDATE_PROFILE)}
                                >
                                    Đi tới Hồ sơ
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {step === 'applying' && <p className="apply-demo__pending">Đang gửi đơn ứng tuyển...</p>}

            {step === 'success' && (
                <p className="apply-demo__ok">✓ Ứng tuyển thành công! Nhà tuyển dụng sẽ xem hồ sơ của bạn.</p>
            )}

            {step === 'error' && (
                <p className="apply-demo__blocked">{errorMessage}</p>
            )}
        </div>
    );
};

export default ApplyDemoButton;