import React, { useState, useImperativeHandle, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './css/AISearch.css';
import { FaRobot } from 'react-icons/fa';
import FeedbackWidget from '../feedback';

const AISearch = forwardRef((props, ref) => {
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showExamples, setShowExamples] = useState(true);
    const [isAnswerComplete, setIsAnswerComplete] = useState(false);
    const [termSelected, setTermSelected] = useState(false);

    let eventSource;

    const commonSearchQueries = [
        "How to install Appsmith on Docker?",
        "How to display, filter and search data in a Table?",
        "How to submit form data"
    ];

    const resetState = () => {
        setInputValue('');
        setSearchTerm('');
        setAnswer('');
        setIsLoading(false);
        setShowExamples(true);
        setTermSelected(false);
        setIsAnswerComplete(false);
    };

    const closeModal = () => {
        if (props.closeModal) {
            props.closeModal();
        }
        setTermSelected(false);
        setAnswer('');
        setIsLoading(false);
        setShowExamples(true);
    };

    useImperativeHandle(ref, () => ({
        resetModal: () => {
            resetState();
            closeModal();
        },
        closeModal,
    }));

    const fetchData = async (query) => {
        setIsLoading(true);
        setAnswer('');
        setSearchTerm(query);
        setShowExamples(false);
        setIsAnswerComplete(false);

        try {
            const projectURL = 'https://ghgdtsupocntpodexlbh.supabase.co/functions/v1/vector-search';
            const queryURL = `${projectURL}/stream?query=${query}`;

            eventSource = new EventSource(queryURL);

            eventSource.addEventListener('error', (err) => {
                setIsLoading(false);
                console.error(err);
            });

            eventSource.addEventListener('message', (e) => {
                setIsLoading(false);

                if (e.data.includes("[DONE]")) {
                    eventSource.close();
                    setIsAnswerComplete(true);
                    return;
                }

                const completionResponse = JSON.parse(e.data);
                const text = completionResponse.choices[0].text;

                setAnswer((prevAnswer) => prevAnswer + text);
            });
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!isLoading) {
                fetchData(inputValue);
                if (isAnswerComplete) {
                    resetState();
                }
            }
        }
    };

    const handleChange = (e) => {
        if (!isLoading) {
            setInputValue(e.target.value);
            if (isAnswerComplete) {
                resetState();
            }
        }
    };

    const handleCommonQueryClick = (query) => {
        if (!isLoading) {
            setTermSelected(true);
            fetchData(query);
        }
    };

    return (
        <div className='ai-search-result-wrapper'>
            <div className='ai-result-container'>
                <input
                    id="question-input"
                    name="question-input"
                    placeholder="Ask Appsmith AI a question..."
                    type="text"
                    value={isAnswerComplete ? '' : termSelected ? searchTerm : inputValue}
                    onKeyDown={handleKeyDown}
                    onChange={handleChange}
                    disabled={isLoading}
                />
                {showExamples && (
                    <div className='ai-query-wrapper'>
                        <span className='ai-query-heading'>Examples</span>
                        {showExamples && commonSearchQueries.map((query, index) => (
                            <span
                                key={index}
                                className='ai-search-term'
                                onClick={() => handleCommonQueryClick(query)}
                            >
                                {query}
                            </span>
                        ))}
                    </div>
                )}

                {isLoading && <div className='loading-indicator'>Loading...</div>}
                {searchTerm && (
                    <div className='search-term-answer'>
                        <FaRobot className='robot-icon' /> <ReactMarkdown>{answer}</ReactMarkdown>
                    </div>
                )}
                {isAnswerComplete && <FeedbackWidget isCalledFromAISearch={true} userTerm={searchTerm} generatedAnswer={answer} />}
            </div>
        </div>
    );
});

export default AISearch;
