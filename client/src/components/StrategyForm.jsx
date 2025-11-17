import React from "react";
import { useForm } from 'react-hook-form';

// Component responsible for defining a strategy and providing backtest parameters
// It receives onRunBacktest function from the parent (Backtest.jsx)
const StrategyForm = ({ onRunBacktest }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            strategyName: 'Initial SMA Strategy',
            symbol: 'SPY',
            startDate: '2020-01-01',
            endDate: '2023-12-31',
            initialCapital: 10000,
            shortPeriod: 20,
            longPeriod: 50,
        }
    });
    const [status, setStatus] = React.useState(null); // 'submitting'

    const onSubmit = async (data) => {
        setStatus('submitting');
        
        // Pass data up to the parent component (Backtest.jsx)
        try {
            await onRunBacktest(data);
            setStatus('success');
        } catch (error) {
            setStatus('error');
            console.error("Backtest submission failed:", error);
        } finally {
            // Clear status after a short delay
            setTimeout(() => setStatus(null), 3000);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700/50 mb-8 max-w-xl">
            <h2 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">
                Configure Backtest
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Strategy Name/Symbol */}
                <input 
                    type="text" 
                    placeholder="Strategy Name" 
                    {...register("strategyName", { required: "Name is required" })} 
                    className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                />
                {errors.strategyName && <p className="text-red-400 text-sm">{errors.strategyName.message}</p>}

                <input 
                    type="text" 
                    placeholder="Symbol (e.g., SPY, AAPL)" 
                    {...register("symbol", { required: "Symbol is required" })} 
                    className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                />
                {errors.symbol && <p className="text-red-400 text-sm">{errors.symbol.message}</p>}

                {/* Dates and Capital */}
                <div className="grid grid-cols-2 gap-4">
                    <input 
                        type="date" 
                        placeholder="Start Date" 
                        {...register("startDate", { required: "Start Date is required" })} 
                        className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                    <input 
                        type="date" 
                        placeholder="End Date" 
                        {...register("endDate", { required: "End Date is required" })} 
                        className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>
                {(errors.startDate || errors.endDate) && <p className="text-red-400 text-sm">Both dates are required.</p>}

                <input 
                    type="number" 
                    step="100"
                    placeholder="Initial Capital (e.g., 10000)" 
                    {...register("initialCapital", { required: "Capital is required", valueAsNumber: true })} 
                    className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                />
                {errors.initialCapital && <p className="text-red-400 text-sm">{errors.initialCapital.message}</p>}

                {/* Example Strategy Parameters (SMA) */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                    <input 
                        type="number" 
                        placeholder="Short SMA Period (e.g., 20)" 
                        {...register("shortPeriod", { valueAsNumber: true })} 
                        className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                    <input 
                        type="number" 
                        placeholder="Long SMA Period (e.g., 50)" 
                        {...register("longPeriod", { valueAsNumber: true })} 
                        className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>

                {/* Status Messages */}
                {status === 'success' && (
                    <div className="p-3 bg-green-900 rounded-lg text-green-300">
                        Backtest parameters submitted! Results loading below.
                    </div>
                )}
                {status === 'error' && (
                    <div className="p-3 bg-red-900 rounded-lg text-red-300">
                        Error submitting parameters. Check console.
                    </div>
                )}

                {/* Submit Button */}
                <button 
                    type="submit" 
                    className="w-full px-4 py-3 text-lg font-semibold rounded-lg bg-teal-500 text-gray-900 hover:bg-teal-400 transition-colors disabled:bg-gray-600 disabled:text-gray-400"
                    disabled={status === 'submitting'}
                >
                    {status === 'submitting' ? 'Running Backtest...' : 'Run Backtest'}
                </button>
            </form>
        </div>
    );
};


export default StrategyForm;
