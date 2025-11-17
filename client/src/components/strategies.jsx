import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import{useForm} from 'react-hook-form';

// Strategies Component to allow users to test trading strategies
const Strategies = () => {
    const { register, handleSubmit } = useForm();
    const onSubmit = async (data) => {
        try{
            const response = await axios.post('/api/strategies/backtest', data);
            console.log('Backtest Results:', response.data);
        } catch (error) {
            console.error('Error running backtest:', error);
        }
    };

    return (
        <form className="Strategies" onSubmit={handleSubmit(onSubmit)}>
            <input type="text" placeholder="Strategy Name" {...register("strategyName")} />
            <input type="text" placeholder="symbol" {...register("symbol")} />
         <input type="text" placeholder="initial capital" {...register("initialCapital")} />
         <input type="text" placeholder= "start date" {...register("startDate")} />
         <input type="text" placeholder="end date" {...register("endDate")} />
         <input type="number" placeholder="" {...register("param1")} />
         <input type="number" placeholder="Parameter 2" {...register("param2")} />
         <button type="submit">Run Backtest</button>

        </form>  
    );
};


export default Strategies;

